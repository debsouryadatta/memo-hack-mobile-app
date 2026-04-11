import { Doc } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";

/** Client-safe user shape: no password, no raw storage id (avatar URL is resolved). */
export type PublicUser = Omit<
  Doc<"users">,
  "password" | "profileImageStorageId"
>;

export async function toPublicUser(
  ctx: QueryCtx | MutationCtx,
  doc: Doc<"users">,
): Promise<PublicUser> {
  const { password: _pw, profileImageStorageId, ...rest } = doc;
  let image = rest.image;
  if (profileImageStorageId) {
    const url = await ctx.storage.getUrl(profileImageStorageId);
    if (url) image = url;
  }
  return { ...rest, image };
}
