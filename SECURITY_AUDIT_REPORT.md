# MemoHack Security Audit Report

**Date:** March 1, 2026  
**Scope:** `apps/mobile`, `apps/admin`, `apps/landing`, `packages/convex`  
**Auth type:** Custom JWT (no Clerk / Convex-native auth)

---

## Summary

| Severity    | Count |
| ----------- | ----- |
| 🔴 Critical | 3     |
| 🟠 High     | 4     |
| 🟡 Medium   | 2     |
| 🔵 Info     | 2     |

---

## 🔴 Critical Issues

---

### C-1 — Hardcoded Fallback Secret in `chapter.ts`

**File:** `packages/convex/chapter.ts` — Line 7

```ts
// ❌ CURRENT (dangerous)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key",
);
```

**Problem:** If `JWT_SECRET` is missing from the environment, the app silently falls back to the literal string `"your-secret-key"`. An attacker who knows (or guesses) this can forge valid JWTs and authenticate as **any user**, including admins.

**Compare to `user.ts` Line 7 which does it correctly:**

```ts
// ✅ user.ts (correct — no fallback)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
```

**Fix:** Remove the fallback entirely and throw if the secret is missing.

```ts
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET environment variable is not set");
const JWT_SECRET = new TextEncoder().encode(secret);
```

---

### C-2 — JWT Token Passed as a Query Argument (Token Exposed in Convex Logs)

**Files:** `packages/convex/user.ts`, `packages/convex/chapter.ts` — every function

```ts
// ❌ All queries and mutations accept token as a plain argument
export const getCurrentUser = query({
  args: { token: v.string() },
  handler: async (ctx, args) => { ... }
});
```

**Problem:** Convex logs all function arguments. Every time any function is called, the raw JWT token is logged by Convex's built-in logging. This means:

- Tokens appear in the Convex dashboard logs in plaintext.
- Any team member with Convex dashboard access can steal a valid token and impersonate any user.
- Admin tokens are especially visible since admin functions also pass the token this way.

**Fix:** Use Convex's `ctx.auth` with a proper auth provider (custom JWT is supported — see [Convex Custom Auth](https://docs.convex.dev/auth/custom-auth)), **or** at minimum use HTTP actions with `Authorization` headers so the token is never in logged arguments.

---

### C-3 — JWT Token Stored in `localStorage` (Admin App — XSS Risk)

**File:** `apps/admin/src/context/AuthContext.tsx` — Lines 48, 87, 96

```ts
// ❌ Admin token stored in localStorage
localStorage.setItem("admin_auth_token", result.token);
const storedToken = localStorage.getItem("admin_auth_token");
```

**Problem:** `localStorage` is accessible by any JavaScript running on the page. If even one XSS vulnerability exists anywhere in the admin app (e.g., a dependency, injected content), an attacker can steal the admin JWT and gain full admin access to all user data.

**Admin access includes:** listing all users, toggling admin status, deleting users, editing user data.

**Fix:** Store the admin token in an `httpOnly` cookie. This makes it invisible to JavaScript entirely.

```ts
// Preferred: set via a server endpoint response with Set-Cookie: httpOnly
// Or as a minimum improvement, use sessionStorage (clears on tab close)
sessionStorage.setItem("admin_auth_token", result.token);
```

---

## 🟠 High Issues

---

### H-1 — No Rate Limiting on Login / Signup Mutations

**Files:** `packages/convex/user.ts` — `signin`, `signup` functions

**Problem:** There is no brute-force protection on the `signin` mutation. An attacker can call it thousands of times per second to guess passwords. Since password hashing uses SHA-256 (not bcrypt/argon2), offline cracking is also faster than it should be.

**Impact:** Account takeover via credential stuffing or brute force.

**Fix:**

1. Add a rate limit (e.g., max 5 failed logins per IP/email per 15 minutes).
2. Consider switching to `bcrypt` or `argon2` for password hashing — SHA-256 is very fast and not designed for passwords.

---

### H-2 — Weak Password Hashing (SHA-256 + Salt instead of bcrypt/Argon2)

**File:** `packages/convex/user.ts` — Lines 51-71

```ts
// ❌ SHA-256 is NOT a password-hashing algorithm
const hashBuffer = await crypto.subtle.digest("SHA-256", data);
```

**Problem:** SHA-256, even with a salt, is a general-purpose hash — it is extremely fast. GPUs can compute billions of SHA-256 hashes per second, making offline dictionary attacks trivial if the `users` database is ever leaked.

**Fix:** Use `bcrypt`, `scrypt`, or `argon2id` — algorithms that are deliberately slow and memory-hard. For Convex (Node.js runtime), use the `bcryptjs` package in an action:

```ts
import bcrypt from "bcryptjs";
const hash = await bcrypt.hash(password, 12); // cost factor 12
```

---

### H-3 — `updateUser` Does Not Verify the Email Belongs to the Authenticated User

**File:** `packages/convex/user.ts` — Lines 160-189

```ts
export const updateUser = mutation({
  args: {
    email: v.string(),  // ← email taken from args, not from the JWT
    token: v.string(),
    ...
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(args.token);
    // ✅ userId comes from the token
    // ❌ but args.email is NOT verified to match the authenticated user
    const filteredUpdates = Object.fromEntries(
      Object.entries(args).filter(([key, value]) => key !== 'token' && value !== undefined)
    );
    await ctx.db.patch(userId, { ...filteredUpdates, updatedAt: Date.now() });
  }
});
```

**Problem:** The `email` field in `args` is passed directly into the patch without checking if the caller is actually changing _their own_ email or someone else's. While `userId` correctly comes from the JWT, an authenticated user could potentially manipulate the email field to conflict with or shadow another user's email — bypassing the duplicate-email check that only exists in `signup`.

**Fix:** Remove `email` from `updateUser` args or add an explicit uniqueness check matching the one in `updateUserAsAdmin`.

---

### H-4 — `password` Field Returned from `signin` / `signup` Responses

**File:** `packages/convex/user.ts` — Lines 113-116, 140-144

```ts
// ❌ The full user object (including hashed password) is returned to the client
const user = await ctx.db.get(userId);
return { user, token };
```

**Problem:** The `user` object from `ctx.db.get()` includes the `password` field (the hashed password). This is sent directly to the mobile app and admin panel after login. While it's a hash, leaking it gives attackers a head start on cracking it offline.

**Note:** The admin queries (`getAllUsers`, `searchUsers`, etc.) correctly strip `password: undefined` — but `signin` and `signup` do not.

**Fix:**

```ts
const { password: _, ...safeUser } = user;
return { user: safeUser, token };
```

---

## 🟡 Medium Issues

---

### M-1 — JWT Token Expiry is 3 Years (`1095d`)

**File:** `packages/convex/user.ts` — Line 12

```ts
.setExpirationTime('1095d') // ← 3 years
```

**Problem:** If a token is stolen, it remains valid for up to 3 years. There is no token revocation mechanism, so there is no way to invalidate compromised tokens.

**Fix:** Use a short-lived token (e.g., `7d` or `30d`) combined with a refresh token strategy, or at minimum provide a "sign out all devices" mutation that invalidates stored sessions.

---

### M-2 — Public Chapter Queries Require No Authentication

**File:** `packages/convex/chapter.ts` — `getChapterById`, `getAllChapters`, `getAllChaptersBySubject`

```ts
// Anyone can call these — no token required
export const getChapterById = query({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chapterId);
  },
});
```

**Problem:** All chapter content (titles, videos, notes, descriptions) is publicly readable without authentication. If content is meant to be exclusively for paid/registered students, this is a business logic flaw.

**Fix (if content should be gated):** Add `requireAuth` to content queries and only serve data to authenticated users.

---

## 🔵 Informational

---

### I-1 — `ctx: any` Type in `requireAdminAuth`

**Files:** `packages/convex/user.ts` Line 35, `chapter.ts` Line 27

```ts
async function requireAdminAuth(ctx: any, token: string) { ... }
```

Using `any` disables TypeScript type checking for the context parameter. Use the proper Convex types instead:

```ts
import { MutationCtx, QueryCtx } from "./_generated/server";
async function requireAdminAuth(ctx: QueryCtx | MutationCtx, token: string) { ... }
```

---

### I-2 — Admin Check is `user?.admin === true` (Truthy Boolean Flag)

**Files:** `packages/convex/user.ts` Line 39, `chapter.ts` Line 31

The `admin` field in the schema is `v.optional(v.boolean())`. A missing field evaluates as `undefined` (falsy), which is correct, **but** if the field is accidentally set to a non-boolean truthy value it could cause unexpected behaviour. Consider using a strict role-based system (`role: "admin" | "user"`) instead of a boolean flag for clarity and extensibility.

---

## Quick Fix Priority

| Priority       | Issue                                                              | Effort          |
| -------------- | ------------------------------------------------------------------ | --------------- |
| 🔴 Fix Now     | C-1: Remove hardcoded `"your-secret-key"` fallback in `chapter.ts` | 5 min           |
| 🔴 Fix Now     | H-4: Strip `password` from `signin`/`signup` responses             | 5 min           |
| 🟠 This Week   | H-2: Switch password hashing to `bcrypt`                           | 1-2 hrs         |
| 🟠 This Week   | C-3: Move admin token to `sessionStorage` or `httpOnly` cookie     | 1 hr            |
| 🟠 This Week   | H-1: Add rate limiting to `signin` mutation                        | 2-3 hrs         |
| 🟡 Next Sprint | C-2: Move token out of Convex query args (use headers/auth)        | Medium refactor |
| 🟡 Next Sprint | M-1: Reduce JWT expiry from 3 years to 7-30 days                   | 30 min          |
