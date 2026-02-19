import { ConvexError } from "convex/values";

export type ErrorCode =
  | "NOT_FOUND"
  | "AUTH_REQUIRED"
  | "ADMIN_REQUIRED"
  | "INVALID_CREDENTIALS"
  | "DUPLICATE"
  | "FORBIDDEN";

export type AppErrorData = {
  code: ErrorCode;
  message: string;
};

export function throwAppError(code: ErrorCode, message: string): never {
  throw new ConvexError<AppErrorData>({ code, message });
}
