import { ConvexError } from "convex/values";
import { toast } from "sonner";

type AppErrorData = {
  code: string;
  message: string;
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ConvexError) {
    const data = error.data as AppErrorData | string;
    if (typeof data === "string") return data;
    if (typeof data === "object" && "message" in data) return data.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred. Please try again.";
}

export function handleError(error: unknown, title = "Error") {
  toast.error(`${title}: ${getErrorMessage(error)}`);
}
