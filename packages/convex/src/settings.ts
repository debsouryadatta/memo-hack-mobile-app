import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

const MOBILE_LATEST_VERSION_KEY = "mobile_latest_version";
const MOBILE_ANDROID_UPDATE_URL_KEY = "mobile_android_update_url";
const MOBILE_IOS_UPDATE_URL_KEY = "mobile_ios_update_url";

export const getMobileUpdateConfig = query({
  args: {},
  handler: async (ctx) => {
    const keys = [
      MOBILE_LATEST_VERSION_KEY,
      MOBILE_ANDROID_UPDATE_URL_KEY,
      MOBILE_IOS_UPDATE_URL_KEY,
    ] as const;

    const rows = await Promise.all(
      keys.map((key) =>
        ctx.db
          .query("config")
          .withIndex("by_key", (q) => q.eq("key", key))
          .first(),
      ),
    );

    return {
      latestVersion: rows[0]?.value ?? null,
      androidUpdateUrl: rows[1]?.value ?? null,
      iosUpdateUrl: rows[2]?.value ?? null,
    };
  },
});

export const upsertConfig = internalMutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
      return { id: existing._id, updated: true };
    }

    const id = await ctx.db.insert("config", {
      key: args.key,
      value: args.value,
    });
    return { id, updated: false };
  },
});
