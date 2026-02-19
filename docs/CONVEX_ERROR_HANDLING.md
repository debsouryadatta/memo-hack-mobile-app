# Convex Error Handling Guide for memo-hack

## Overview

Convex provides a built-in error class called `ConvexError` that lets you throw **structured, typed errors** from your backend handler functions and catch them cleanly on the client. This is different from plain `throw new Error(...)` — `ConvexError` data survives production redaction and can carry structured payloads (codes, messages, metadata).

**Current state of our codebase:** All backend functions use plain `throw new Error(...)`, and the mobile app catches errors generically via `error.message`. There are no error boundaries, no `ConvexError` imports, and query errors are completely unhandled.

---

## 1. Backend: Using `ConvexError` in Handler Functions

### Import

```typescript
import { ConvexError } from "convex/values";
```

### Throwing Errors

`ConvexError` accepts any Convex-serializable data type as its payload:

```typescript
// Simple string
throw new ConvexError("User not found");

// Structured object (recommended)
throw new ConvexError({
  code: "NOT_FOUND",
  message: "User not found",
});

// With extra metadata
throw new ConvexError({
  code: "AUTH_FAILED",
  message: "Invalid or expired token",
  status: 401,
});
```

### Why `ConvexError` over `Error`?

| Feature | `throw new Error(...)` | `throw new ConvexError(...)` |
|---|---|---|
| Message visible in production | ❌ Redacted to generic "Server Error" | ✅ `data` payload always available |
| Structured data | ❌ String only | ✅ Objects, arrays, numbers, etc. |
| Client can distinguish error types | ❌ No | ✅ `instanceof ConvexError` check |
| Mutations roll back on throw | ✅ Yes | ✅ Yes |

---

## 2. How to Migrate Our Backend

### Step 1: Define a standard error shape

Create a shared error helper in the convex package:

```typescript
// packages/convex/errors.ts
import { ConvexError } from "convex/values";

// Standard error codes for our app
export type ErrorCode =
  | "NOT_FOUND"
  | "AUTH_REQUIRED"
  | "ADMIN_REQUIRED"
  | "INVALID_INPUT"
  | "DUPLICATE"
  | "FORBIDDEN"
  | "INVALID_CREDENTIALS";

export type AppErrorData = {
  code: ErrorCode;
  message: string;
};

/**
 * Throw a structured application error.
 * The `data` payload is always available on the client, even in production.
 */
export function throwAppError(code: ErrorCode, message: string): never {
  throw new ConvexError<AppErrorData>({ code, message });
}
```

### Step 2: Replace `throw new Error(...)` calls

**Before (current):**

```typescript
// packages/convex/user.ts
if (existingUser) {
  throw new Error("User with this email already exists");
}
```

**After:**

```typescript
// packages/convex/user.ts
import { throwAppError } from "./errors";

if (existingUser) {
  throwAppError("DUPLICATE", "User with this email already exists");
}
```

### Step 3: Update auth helpers

**Before:**

```typescript
async function requireAuth(token: string) {
  if (!token) {
    throw new Error("Authentication required");
  }
  const decoded = await verifyToken(token);
  return decoded.userId;
}

async function requireAdminAuth(ctx: any, token: string) {
  const userId = await requireAuth(token);
  const user = await ctx.db.get(userId as Id<"users">);
  if (!user?.admin) {
    throw new Error("Admin access required");
  }
  return user;
}
```

**After:**

```typescript
import { throwAppError } from "./errors";

async function requireAuth(token: string) {
  if (!token) {
    throwAppError("AUTH_REQUIRED", "Authentication required");
  }
  const decoded = await verifyToken(token);
  return decoded.userId;
}

async function requireAdminAuth(ctx: any, token: string) {
  const userId = await requireAuth(token);
  const user = await ctx.db.get(userId as Id<"users">);
  if (!user?.admin) {
    throwAppError("ADMIN_REQUIRED", "Admin access required");
  }
  return user;
}
```

### Full migration reference for existing errors

| File | Current Error | Replacement |
|---|---|---|
| `user.ts` | `"User with this email already exists"` | `throwAppError("DUPLICATE", "...")` |
| `user.ts` | `"User not found"` | `throwAppError("NOT_FOUND", "...")` |
| `user.ts` | `"Invalid password"` | `throwAppError("INVALID_CREDENTIALS", "...")` |
| `user.ts` | `"Authentication required"` | `throwAppError("AUTH_REQUIRED", "...")` |
| `user.ts` | `"Admin access required"` | `throwAppError("ADMIN_REQUIRED", "...")` |
| `user.ts` | `"Invalid or expired token"` | `throwAppError("AUTH_REQUIRED", "...")` |
| `user.ts` | `"Cannot remove your own admin status"` | `throwAppError("FORBIDDEN", "...")` |
| `user.ts` | `"Cannot delete your own account"` | `throwAppError("FORBIDDEN", "...")` |
| `user.ts` | `"Email already in use"` | `throwAppError("DUPLICATE", "...")` |
| `chapter.ts` | `"Chapter not found"` | `throwAppError("NOT_FOUND", "...")` |
| `chapter.ts` | `"Invalid or expired token"` | `throwAppError("AUTH_REQUIRED", "...")` |
| `chapter.ts` | `"Admin access required"` | `throwAppError("ADMIN_REQUIRED", "...")` |
| `chapter.ts` | `"Authentication required"` | `throwAppError("AUTH_REQUIRED", "...")` |

---

## 3. Client-Side: Handling `ConvexError`

### Catching mutation errors

```typescript
import { ConvexError } from "convex/values";

// In your mutation call sites (e.g., signin, signup, etc.)
try {
  await signIn({ email, password });
} catch (error) {
  if (error instanceof ConvexError) {
    // error.data is our AppErrorData object
    const { code, message } = error.data as { code: string; message: string };

    switch (code) {
      case "INVALID_CREDENTIALS":
        Alert.alert("Login Failed", message);
        break;
      case "NOT_FOUND":
        Alert.alert("Not Found", message);
        break;
      default:
        Alert.alert("Error", message);
    }
  } else {
    // Developer error or internal Convex error
    Alert.alert("Error", "An unexpected error occurred. Please try again.");
  }
}
```

### Optional: Create a client-side helper

```typescript
// apps/mobile/lib/errors.ts
import { ConvexError } from "convex/values";
import { Alert } from "react-native";

type AppErrorData = {
  code: string;
  message: string;
};

/**
 * Extract a user-friendly message from any error.
 * ConvexError data survives production redaction.
 * Plain Error messages are redacted in production to "Server Error".
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ConvexError) {
    const data = error.data as AppErrorData | string;
    if (typeof data === "string") return data;
    return data.message;
  }
  return "An unexpected error occurred. Please try again.";
}

/**
 * Extract the error code from a ConvexError, if available.
 */
export function getErrorCode(error: unknown): string | null {
  if (error instanceof ConvexError) {
    const data = error.data as AppErrorData | string;
    if (typeof data === "object" && "code" in data) return data.code;
  }
  return null;
}

/**
 * Show an Alert for any caught error.
 */
export function handleError(error: unknown, title = "Error") {
  Alert.alert(title, getErrorMessage(error));
}
```

Then usage becomes:

```typescript
import { handleError } from "@/lib/errors";

try {
  await signIn({ email, password });
} catch (error) {
  handleError(error, "Login Failed");
}
```

### Handling query errors

Query errors are thrown during React rendering. Use an **Error Boundary** to catch them:

```tsx
// apps/mobile/components/ErrorBoundary.tsx
import React, { Component, type PropsWithChildren } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ConvexError } from "convex/values";

type State = { hasError: boolean; errorMessage: string };

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error) {
    const message =
      error instanceof ConvexError
        ? typeof error.data === "string"
          ? error.data
          : (error.data as any).message ?? "Something went wrong"
        : "An unexpected error occurred";
    return { hasError: true, errorMessage: message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
            Something went wrong
          </Text>
          <Text style={{ color: "#666", textAlign: "center", marginBottom: 16 }}>
            {this.state.errorMessage}
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, errorMessage: "" })}
            style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#007AFF", borderRadius: 8 }}
          >
            <Text style={{ color: "white" }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
```

Wrap your app or specific screens:

```tsx
// In your root layout or providers
<ErrorBoundary>
  <ConvexProvider client={convex}>
    <App />
  </ConvexProvider>
</ErrorBoundary>
```

---

## 4. Quick Summary — What to Do

### Backend changes

1. **Create** `packages/convex/errors.ts` with `throwAppError` helper and `ErrorCode` type.
2. **Replace** all `throw new Error(...)` in `user.ts` and `chapter.ts` with `throwAppError(...)`.
3. **Export** `AppErrorData` and `ErrorCode` types so the client can import them if needed.

### Mobile app changes

1. **Create** `apps/mobile/lib/errors.ts` with `getErrorMessage`, `getErrorCode`, and `handleError` helpers.
2. **Update** all `catch (error: any)` blocks to use `handleError(error)` or the `getErrorMessage` helper.
3. **Create** an `ErrorBoundary` component for catching query errors during rendering.
4. **Wrap** the app root (or individual screens) with `<ErrorBoundary>`.

### Key rules

- **Queries**: Errors propagate to React rendering → caught by Error Boundaries.
- **Mutations**: Errors reject the returned promise → caught by `try/catch` or `.catch()`.
- **Actions**: Same as mutations, but are NOT auto-retried. Handle retries yourself.
- **Production**: Plain `Error` messages are redacted. Only `ConvexError.data` survives.

---

## References

- [Convex Error Handling Docs](https://docs.convex.dev/functions/error-handling)
- [Convex Application Errors](https://docs.convex.dev/functions/error-handling/application-errors)
- [ConvexError API Reference](https://docs.convex.dev/api/classes/values.ConvexError)
