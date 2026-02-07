# Security Audit Report - Convex Custom Authentication

**Date:** February 7, 2026  
**Project:** memo-hack  
**Scope:** Custom JWT authentication implementation in Convex backend  
**Status:** ⚠️ NOT PRODUCTION READY - Critical issues found

---

## Executive Summary

Your custom authentication implementation demonstrates a solid understanding of core security concepts including password salting, JWT usage, and access control. However, several critical and high-severity vulnerabilities were identified that **must be addressed before production deployment**.

**Key Findings:**

- 🔴 1 Critical vulnerability (hardcoded JWT secret fallback)
- 🔴 2 High-severity issues (weak password hashing, excessive token expiration)
- 🟡 4 Medium-severity issues
- 🟢 2 Low-severity issues

---

## 🔴 CRITICAL SEVERITY ISSUES

### 1. Hardcoded JWT Secret Fallback in `chapter.ts`

**File:** `convex/chapter.ts`  
**Line:** 6  
**Risk Level:** CRITICAL

#### Current Code:

```typescript
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key",
);
```

#### Problem:

- If `JWT_SECRET` environment variable is not set, it falls back to the hardcoded string `"your-secret-key"`
- Anyone who reads this code can forge valid JWT tokens
- Complete authentication bypass is possible
- All user accounts are compromised

#### Impact:

- Attackers can impersonate any user
- Attackers can create admin accounts
- Complete loss of authentication security

#### Required Fix:

```typescript
// Fail fast if JWT_SECRET is not configured
if (!process.env.JWT_SECRET) {
  throw new Error("CRITICAL: JWT_SECRET environment variable must be set");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
```

#### Additional Notes:

- Also apply this check in `user.ts` (currently has no fallback but also no validation)
- Ensure JWT_SECRET is set in your Convex environment variables
- Use a strong, randomly generated secret (minimum 32 characters)

---

## 🔴 HIGH SEVERITY ISSUES

### 2. Weak Password Hashing Algorithm (SHA-256)

**File:** `convex/user.ts`  
**Lines:** 50-71  
**Risk Level:** HIGH

#### Current Code:

```typescript
async function hashPassword(password: string): Promise<string> {
  const salt = await generateSalt();
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${salt}:${hashHex}`;
}
```

#### Problem:

- SHA-256 is a **cryptographic hash**, not a **password hashing function**
- SHA-256 is extremely fast (~1 billion hashes/second on modern GPUs)
- Makes brute-force attacks feasible even with salting
- Not memory-hard, vulnerable to GPU/ASIC attacks

#### Impact:

- If database is compromised, passwords can be cracked quickly
- Rainbow table attacks are mitigated by salt, but brute-force is still viable
- Weak passwords (common words, patterns) can be cracked in seconds

#### Required Fix:

**Option 1: bcrypt (Recommended for Convex)**

```typescript
import bcrypt from "bcryptjs"; // Pure JS implementation

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Higher = more secure but slower
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
```

**Option 2: Argon2 (Best security, if available in Convex)**

```typescript
import argon2 from "argon2";

async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
}

async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return await argon2.verify(hashedPassword, password);
}
```

#### Dependencies Required:

```bash
npm install bcryptjs
# or
npm install argon2
```

#### Migration Strategy:

1. Update hashing functions
2. New passwords will use new algorithm
3. On user login, detect old SHA-256 hashes and rehash with new algorithm
4. Gradually migrate all passwords

---

### 3. Excessive JWT Token Expiration (3 Years)

**File:** `convex/user.ts`  
**Line:** 11  
**Risk Level:** HIGH

#### Current Code:

```typescript
async function generateToken(userId: string): Promise<string> {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1095d") // 3 years!
    .setIssuedAt()
    .sign(JWT_SECRET);
}
```

#### Problem:

- 3-year (1095 days) token expiration is excessively long
- If token is stolen/compromised, attacker has access for 3 years
- No way to invalidate tokens (no logout mechanism)
- Password changes don't invalidate existing tokens

#### Impact:

- Stolen tokens remain valid indefinitely
- Users cannot truly "log out"
- Compromised devices remain authenticated
- No defense against token theft

#### Required Fix:

**Option 1: Short-lived tokens (Recommended)**

```typescript
async function generateToken(userId: string): Promise<string> {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d") // 7 days maximum
    .setIssuedAt()
    .sign(JWT_SECRET);
}
```

**Option 2: Access + Refresh Token Pattern (Best practice)**

```typescript
// Short-lived access token (15-60 minutes)
async function generateAccessToken(userId: string): Promise<string> {
  return await new SignJWT({ userId, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

// Long-lived refresh token (7-30 days)
async function generateRefreshToken(userId: string): Promise<string> {
  return await new SignJWT({ userId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}
```

#### Recommended Expiration Times:

- **Access Token:** 15 minutes - 1 hour
- **Refresh Token:** 7-30 days
- **Remember Me:** 30-90 days (with explicit user consent)

---

## 🟡 MEDIUM SEVERITY ISSUES

### 4. No Token Revocation Mechanism

**Files:** `convex/user.ts`, `convex/chapter.ts`  
**Risk Level:** MEDIUM

#### Problem:

- Once a JWT is issued, there's no way to invalidate it before expiration
- Users cannot truly "log out" (token remains valid)
- Password changes don't invalidate existing sessions
- Compromised tokens cannot be revoked

#### Impact:

- Stolen tokens remain valid until expiration
- No emergency revocation capability
- Users cannot force logout from all devices

#### Required Fix:

**Option 1: Token Version (Simpler)**

Add to schema:

```typescript
// schema.ts
users: defineTable({
  // ... existing fields
  tokenVersion: v.number(), // Add this
}).index("by_email", ["email"]),
```

Update token generation:

```typescript
async function generateToken(
  userId: string,
  tokenVersion: number,
): Promise<string> {
  return await new SignJWT({ userId, tokenVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

async function verifyToken(token: string): Promise<{ userId: string }> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Verify token version matches current user version
    const user = await ctx.db.get(payload.userId as Id<"users">);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new Error("Token has been revoked");
    }

    return { userId: payload.userId as string };
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}
```

Add logout mutation:

```typescript
export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(args.token);
    const user = await ctx.db.get(userId as Id<"users">);

    // Increment token version to invalidate all existing tokens
    await ctx.db.patch(userId as Id<"users">, {
      tokenVersion: (user?.tokenVersion || 0) + 1,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
```

**Option 2: Token Blacklist (More complex)**

- Maintain a table of revoked tokens
- Check blacklist on each request
- Requires cleanup of expired tokens

---

### 5. No Password Strength Validation

**File:** `convex/user.ts`  
**Lines:** 73-117 (signup), 209-237 (changePassword)  
**Risk Level:** MEDIUM

#### Problem:

- No minimum password length requirement
- No complexity requirements
- Users can set passwords like "a", "123", "password"

#### Impact:

- Weak passwords are easily brute-forced
- Account takeover through password guessing
- Reduced overall security posture

#### Required Fix:

```typescript
function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  if (password.length > 128) {
    throw new Error("Password must be less than 128 characters");
  }

  // Optional: Add complexity requirements
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const complexityCount = [
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
  ].filter(Boolean).length;

  if (complexityCount < 3) {
    throw new Error(
      "Password must contain at least 3 of: uppercase, lowercase, numbers, special characters",
    );
  }
}

// Use in signup and changePassword
export const signup = mutation({
  args: {
    /* ... */
  },
  handler: async (ctx, args) => {
    validatePassword(args.password); // Add this line

    // ... rest of signup logic
  },
});
```

#### Recommended Password Policy:

- Minimum 8 characters (12+ recommended)
- Maximum 128 characters (prevent DoS)
- At least 3 of: uppercase, lowercase, numbers, special characters
- Optional: Check against common password lists

---

### 6. Password Field Not Properly Excluded from Responses

**File:** `convex/user.ts`  
**Lines:** 250-254, 270-273, 293-296  
**Risk Level:** MEDIUM

#### Current Code:

```typescript
return users.map((u) => ({
  ...u,
  password: undefined,
}));
```

#### Problem:

- Setting `password: undefined` still includes the key in the object
- While the value is undefined, it's not best practice
- Potential for accidental password leakage if serialization changes

#### Impact:

- Low risk of password exposure
- Not following security best practices
- Potential confusion in API responses

#### Required Fix:

```typescript
// Better approach: Use destructuring to exclude password
return users.map(({ password, ...rest }) => rest);
```

Apply to all functions that return user objects:

- `getAllUsers` (line 250)
- `getUsersByClass` (line 270)
- `searchUsers` (line 293)
- `updateUserAsAdmin` (line 424)

---

### 7. Missing Input Validation and Sanitization

**File:** `convex/user.ts`  
**Lines:** Throughout all mutations  
**Risk Level:** MEDIUM

#### Problem:

- No email format validation
- No phone number format validation
- No maximum length limits on string fields
- No sanitization of user inputs

#### Impact:

- Invalid data in database
- Potential for injection attacks (though Convex provides some protection)
- Poor user experience (accepting invalid emails)
- Potential DoS through extremely long inputs

#### Required Fix:

```typescript
function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }
  if (email.length > 255) {
    throw new Error("Email is too long");
  }
}

function validatePhone(phone: string): void {
  // Adjust regex based on your requirements
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone.replace(/[\s\-()]/g, ""))) {
    throw new Error("Invalid phone number format");
  }
}

function validateName(name: string): void {
  if (name.length < 1) {
    throw new Error("Name is required");
  }
  if (name.length > 100) {
    throw new Error("Name is too long");
  }
}

function validateClass(classValue: string): void {
  const validClasses = ["9", "10", "11", "12", "JEE", "NEET"];
  if (!validClasses.includes(classValue)) {
    throw new Error("Invalid class value");
  }
}

// Use in signup mutation
export const signup = mutation({
  args: {
    /* ... */
  },
  handler: async (ctx, args) => {
    validateEmail(args.email);
    validatePassword(args.password);
    validateName(args.name);
    validatePhone(args.phone);
    validateClass(args.class);

    // ... rest of signup logic
  },
});
```

---

## 🟢 LOW SEVERITY ISSUES

### 8. No Rate Limiting

**Files:** All mutation endpoints  
**Risk Level:** LOW (depends on Convex platform protections)

#### Problem:

- No protection against brute-force login attempts
- No protection against account enumeration
- No protection against password spray attacks
- No protection against DoS through repeated requests

#### Impact:

- Attackers can attempt unlimited login attempts
- Email enumeration to find valid accounts
- Resource exhaustion

#### Notes:

- Rate limiting may need to be implemented at the Convex platform level
- Check if Convex provides built-in rate limiting
- May require a proxy/middleware layer

#### Potential Fix (if Convex supports):

```typescript
// Pseudocode - depends on Convex capabilities
export const signin = mutation({
  args: {
    /* ... */
  },
  handler: async (ctx, args) => {
    // Check rate limit for this IP/email
    await checkRateLimit(ctx, args.email);

    // ... rest of signin logic
  },
});
```

#### Recommended Rate Limits:

- **Login attempts:** 5 attempts per 15 minutes per email
- **Signup:** 3 signups per hour per IP
- **Password reset:** 3 attempts per hour per email

---

### 9. No Audit Logging

**Files:** All mutations  
**Risk Level:** LOW

#### Problem:

- No logging of authentication events
- No tracking of failed login attempts
- No audit trail for admin actions
- Difficult to detect security incidents

#### Impact:

- Cannot detect brute-force attacks
- Cannot investigate security incidents
- No compliance with audit requirements

#### Required Fix:

Add audit log table to schema:

```typescript
// schema.ts
auditLogs: defineTable({
  userId: v.optional(v.id("users")),
  action: v.string(),
  details: v.optional(v.string()),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  success: v.boolean(),
  timestamp: v.number(),
}).index("by_userId", ["userId"])
  .index("by_timestamp", ["timestamp"]),
```

Add logging helper:

```typescript
async function logAuditEvent(
  ctx: any,
  action: string,
  userId?: string,
  success: boolean = true,
  details?: string,
) {
  await ctx.db.insert("auditLogs", {
    userId: userId as Id<"users"> | undefined,
    action,
    details,
    success,
    timestamp: Date.now(),
  });
}

// Use in signin
export const signin = mutation({
  args: {
    /* ... */
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      await logAuditEvent(
        ctx,
        "signin_failed",
        undefined,
        false,
        "User not found",
      );
      throw new Error("User not found");
    }

    const isValidPassword = await verifyPassword(args.password, user.password);
    if (!isValidPassword) {
      await logAuditEvent(
        ctx,
        "signin_failed",
        user._id,
        false,
        "Invalid password",
      );
      throw new Error("Invalid password");
    }

    await logAuditEvent(ctx, "signin_success", user._id, true);

    const token = await generateToken(user._id);
    return { user, token };
  },
});
```

---

## ✅ What You Did Well

Your implementation shows good security awareness in several areas:

1. ✅ **Proper salt generation** using `crypto.getRandomValues()`
2. ✅ **Unique salt per password** (new salt for each hash)
3. ✅ **Email uniqueness validation** before signup
4. ✅ **Admin self-protection** (cannot delete self or remove own admin status)
5. ✅ **Email uniqueness check** on admin updates
6. ✅ **Proper JWT library usage** (Jose)
7. ✅ **Algorithm specification** in JWT header
8. ✅ **Issued-at timestamp** in JWTs
9. ✅ **Separation of concerns** (auth helpers, mutations, queries)
10. ✅ **Admin authorization checks** for sensitive operations

---

## 📋 Implementation Checklist

### Phase 1: Critical Fixes (DO IMMEDIATELY)

- [ ] Remove hardcoded JWT secret fallback in `chapter.ts`
- [ ] Add JWT_SECRET validation in both files
- [ ] Ensure JWT_SECRET is set in Convex environment

### Phase 2: High Priority Fixes (BEFORE PRODUCTION)

- [ ] Replace SHA-256 with bcrypt or Argon2
- [ ] Install bcryptjs dependency
- [ ] Update `hashPassword` and `verifyPassword` functions
- [ ] Reduce JWT expiration from 3 years to 7-30 days
- [ ] Consider implementing refresh token pattern

### Phase 3: Medium Priority Fixes (RECOMMENDED)

- [ ] Add `tokenVersion` field to user schema
- [ ] Implement token revocation via version checking
- [ ] Add `logout` mutation
- [ ] Add password strength validation
- [ ] Add email format validation
- [ ] Add phone number validation
- [ ] Add name and class validation
- [ ] Fix password exclusion in responses (use destructuring)

### Phase 4: Low Priority Enhancements (NICE TO HAVE)

- [ ] Investigate Convex rate limiting options
- [ ] Implement rate limiting if possible
- [ ] Add audit logging table to schema
- [ ] Add audit logging to all auth operations
- [ ] Add failed login attempt tracking

---

## 🔧 Dependencies to Install

```bash
# For password hashing (choose one)
npm install bcryptjs
# or
npm install argon2

# For validation (optional but recommended)
npm install validator
```

---

## 📚 Additional Security Recommendations

### 1. Environment Variables

- Use a strong, randomly generated JWT_SECRET (minimum 32 characters)
- Never commit secrets to version control
- Use Convex environment variable management

### 2. HTTPS Only

- Ensure all API calls use HTTPS
- Set secure cookie flags if using cookies

### 3. Security Headers

- Implement CSP (Content Security Policy)
- Add X-Frame-Options
- Add X-Content-Type-Options

### 4. Regular Security Reviews

- Review dependencies for vulnerabilities
- Keep libraries up to date
- Conduct periodic security audits

### 5. Monitoring

- Monitor for unusual authentication patterns
- Alert on multiple failed login attempts
- Track admin actions

---

## 🎯 Final Verdict

**Current Status:** ⚠️ **NOT PRODUCTION READY**

**Required Actions:**

1. Fix the critical JWT secret fallback immediately
2. Replace SHA-256 password hashing with bcrypt/Argon2
3. Reduce JWT token expiration time
4. Add password validation

**Timeline Recommendation:**

- **Phase 1 (Critical):** Fix today before any deployment
- **Phase 2 (High):** Complete within 1-2 days
- **Phase 3 (Medium):** Complete within 1 week
- **Phase 4 (Low):** Complete within 2-4 weeks

Once Phase 1 and Phase 2 are complete, the system will be **acceptable for production** with the understanding that Phase 3 improvements should follow soon after.

---

## 📞 Questions or Concerns?

Review this document carefully and let me know when you're ready to proceed with implementing these fixes. I can help with:

- Implementing any of these fixes
- Explaining any security concepts
- Testing the updated implementation
- Migration strategies for existing users

**Ready to proceed when you are!**
