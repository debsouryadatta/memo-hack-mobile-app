import { ConvexError } from "convex/values";

export type ErrorCode =
  | "NOT_FOUND"
  | "AUTH_REQUIRED"
  | "ADMIN_REQUIRED"
  | "INVALID_CREDENTIALS"
  | "INVALID_INPUT"
  | "DUPLICATE"
  | "FORBIDDEN"
  | "LIMIT_REACHED"
  | "RATE_LIMITED";

export type AppErrorData = {
  code: ErrorCode;
  message: string;
};

export function throwAppError(code: ErrorCode, message: string): never {
  throw new ConvexError<AppErrorData>({ code, message });
}
