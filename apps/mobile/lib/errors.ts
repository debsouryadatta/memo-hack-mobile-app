import { ConvexError } from "convex/values";
import { alertInfo } from "./confirm";

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
    if (typeof data === "object" && "message" in data) return data.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred. Please try again.";
}

/**
 * Show the shared in-app dialog for any caught error.
 */
export function handleError(error: unknown, title = "Error") {
  alertInfo(title, getErrorMessage(error));
}
