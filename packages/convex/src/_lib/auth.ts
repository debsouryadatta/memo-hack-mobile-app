import { Doc, Id } from "../_generated/dataModel";
import {
  ActionCtx,
  MutationCtx,
  QueryCtx,
} from "../_generated/server";
import { throwAppError } from "./errors";

/**
 * Require a valid Convex identity (custom JWT: subject = users doc id).
 * Use in queries/mutations/actions that must only run for signed-in clients.
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throwAppError("AUTH_REQUIRED", "Authentication required");
  }
  return identity.subject;
}

/**
 * Require an authenticated user whose `users.admin` flag is true.
 * Not available in ActionCtx — use a query/mutation or re-check from an action via runQuery.
 */
export async function requireAdminAuth(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const userId = await requireAuth(ctx);

  const user = await ctx.db.get(userId as Id<"users">);
  if (!user?.admin) {
    throwAppError("ADMIN_REQUIRED", "Admin access required");
  }
  return user;
}
