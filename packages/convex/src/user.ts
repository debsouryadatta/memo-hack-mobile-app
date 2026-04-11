import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireAdminAuth, requireAuth } from "./_lib/auth";
import { throwAppError } from "./_lib/errors";
import { generateToken } from "./_lib/jwt";
import {
  hashPassword,
  isLegacyPasswordHash,
  verifyPassword,
} from "./_lib/password";
import { PublicUser, toPublicUser } from "./_lib/publicUser";
import {
  validateOptionalProfilePatch,
  validatePasswordChange,
  validateSearchTerm,
  validateSigninFields,
  validateSignupFields,
} from "./_lib/userInput";

/** Re-export for call sites that only need auth checks (see aiChat). */
export { requireAuth } from "./_lib/auth";

export type { PublicUser };

/** For signed-in users (profile edit). */
export const generateProfileImageUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { uploadUrl };
  },
});

/** Before account exists — public; orphaned uploads possible if user abandons signup. */
export const generateSignupProfileImageUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { uploadUrl };
  },
});

export const commitProfileImageUpload = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const user = await ctx.db.get(userId as Id<"users">);
    if (!user) {
      throwAppError("NOT_FOUND", "User not found");
    }

    if (
      user.profileImageStorageId &&
      user.profileImageStorageId !== args.storageId
    ) {
      await ctx.storage.delete(user.profileImageStorageId);
    }

    const url = await ctx.storage.getUrl(args.storageId);
    await ctx.db.patch(userId as Id<"users">, {
      profileImageStorageId: args.storageId,
      image: url ?? user.image,
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get(userId as Id<"users">);
    if (!updated) {
      throwAppError("NOT_FOUND", "User not found");
    }
    return await toPublicUser(ctx, updated);
  },
});

export const signup = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.string(),
    image: v.optional(v.string()),
    profileImageStorageId: v.optional(v.id("_storage")),
    class: v.string(),
    memohackStudent: v.boolean(),
  },
  handler: async (ctx, args) => {
    validateSignupFields(args);

    const email = args.email.trim();
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throwAppError("DUPLICATE", "User with this email already exists");
    }

    const hashedPassword = await hashPassword(args.password);
    const now = Date.now();

    const defaultAvatar = `https://eu.ui-avatars.com/api/?name=${encodeURIComponent(args.name.trim())}&size=250`;
    let image = args.image?.trim() || defaultAvatar;
    let profileImageStorageId: Id<"_storage"> | undefined = undefined;

    if (args.profileImageStorageId) {
      const url = await ctx.storage.getUrl(args.profileImageStorageId);
      if (!url) {
        throwAppError("INVALID_INPUT", "Invalid profile image");
      }
      profileImageStorageId = args.profileImageStorageId;
      image = url;
    }

    const userId = await ctx.db.insert("users", {
      email,
      password: hashedPassword,
      name: args.name.trim(),
      phone: args.phone.trim(),
      image,
      ...(profileImageStorageId ? { profileImageStorageId } : {}),
      class: args.class.trim(),
      memohackStudent: args.memohackStudent,
      admin: false,
      createdAt: now,
      updatedAt: now,
    });

    const user = await ctx.db.get(userId);
    if (!user) {
      throwAppError("NOT_FOUND", "User not found");
    }

    const token = await generateToken(userId);
    return {
      user: await toPublicUser(ctx, user),
      token,
    };
  },
});

export const signin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    validateSigninFields(args);

    const email = args.email.trim();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throwAppError("INVALID_CREDENTIALS", "Invalid email or password");
    }

    const isValidPassword = await verifyPassword(args.password, user.password);
    if (!isValidPassword) {
      throwAppError("INVALID_CREDENTIALS", "Invalid email or password");
    }

    if (isLegacyPasswordHash(user.password)) {
      await ctx.db.patch(user._id, {
        password: await hashPassword(args.password),
        updatedAt: Date.now(),
      });
    }

    const token = await generateToken(user._id);
    return {
      user: await toPublicUser(ctx, user),
      token,
    };
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db.get(identity.subject as Id<"users">);
    return user ? await toPublicUser(ctx, user) : null;
  },
});

export const updateUser = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    class: v.optional(v.string()),
    memohackStudent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const user = await ctx.db.get(userId as Id<"users">);

    if (!user) {
      throwAppError("NOT_FOUND", "User not found");
    }

    validateOptionalProfilePatch({
      email: args.email,
      name: args.name,
      phone: args.phone,
      image: args.image,
      class: args.class,
    });

    const hasUpdate =
      args.email !== undefined ||
      args.name !== undefined ||
      args.phone !== undefined ||
      args.image !== undefined ||
      args.class !== undefined ||
      args.memohackStudent !== undefined;

    if (!hasUpdate) {
      throwAppError("INVALID_INPUT", "Provide at least one field to update");
    }

    const nextEmail = args.email !== undefined ? args.email.trim() : undefined;
    if (nextEmail !== undefined && nextEmail !== user.email) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", nextEmail))
        .first();
      if (existingUser) {
        throwAppError("DUPLICATE", "Email already in use");
      }
    }

    type Patchable = Pick<
      Doc<"users">,
      | "email"
      | "name"
      | "phone"
      | "image"
      | "class"
      | "memohackStudent"
      | "profileImageStorageId"
    >;

    const patch: Partial<Patchable> & { updatedAt: number } = {
      updatedAt: Date.now(),
    };

    if (nextEmail !== undefined) patch.email = nextEmail;
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.phone !== undefined) patch.phone = args.phone.trim();
    if (args.image !== undefined) {
      if (user.profileImageStorageId) {
        await ctx.storage.delete(user.profileImageStorageId);
      }
      patch.image = args.image.trim();
      patch.profileImageStorageId = undefined;
    }
    if (args.class !== undefined) patch.class = args.class.trim();
    if (args.memohackStudent !== undefined)
      patch.memohackStudent = args.memohackStudent;

    await ctx.db.patch(userId as Id<"users">, patch);

    const updated = await ctx.db.get(userId as Id<"users">);
    if (!updated) {
      throwAppError("NOT_FOUND", "User not found");
    }
    return await toPublicUser(ctx, updated);
  },
});

export const deleteUser = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const user = await ctx.db.get(userId as Id<"users">);

    if (!user) {
      throwAppError("NOT_FOUND", "User not found");
    }

    if (user.profileImageStorageId) {
      await ctx.storage.delete(user.profileImageStorageId);
    }

    await ctx.db.delete(userId as Id<"users">);
    return { success: true };
  },
});

export const changePassword = mutation({
  args: {
    oldPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    validatePasswordChange(args.oldPassword, args.newPassword);

    const userId = await requireAuth(ctx);

    const user = await ctx.db.get(userId as Id<"users">);

    if (!user) {
      throwAppError("NOT_FOUND", "User not found");
    }

    const isValidOldPassword = await verifyPassword(
      args.oldPassword,
      user.password,
    );
    if (!isValidOldPassword) {
      throwAppError("INVALID_CREDENTIALS", "Invalid old password");
    }

    const hashedNewPassword = await hashPassword(args.newPassword);
    await ctx.db.patch(userId as Id<"users">, {
      password: hashedNewPassword,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Admin functions for managing users
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdminAuth(ctx);

    const users = await ctx.db.query("users").collect();

    return Promise.all(users.map((u) => toPublicUser(ctx, u)));
  },
});

export const getUsersByClass = query({
  args: {
    class: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminAuth(ctx);

    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("class"), args.class))
      .collect();

    return Promise.all(users.map((u) => toPublicUser(ctx, u)));
  },
});

export const searchUsers = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminAuth(ctx);

    validateSearchTerm(args.searchTerm);

    const users = await ctx.db.query("users").collect();

    const searchLower = args.searchTerm.toLowerCase();
    const filtered = users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower),
    );

    return Promise.all(filtered.map((u) => toPublicUser(ctx, u)));
  },
});

export const toggleUserAdminStatus = mutation({
  args: {
    targetUserId: v.id("users"),
    admin: v.boolean(),
  },
  handler: async (ctx, args) => {
    const adminUser = await requireAdminAuth(ctx);

    const targetUser = await ctx.db.get(args.targetUserId);
    if (!targetUser) {
      throwAppError("NOT_FOUND", "User not found");
    }

    // Prevent users from removing their own admin status
    if (adminUser._id === args.targetUserId && !args.admin) {
      throwAppError("FORBIDDEN", "Cannot remove your own admin status");
    }

    await ctx.db.patch(args.targetUserId, {
      admin: args.admin,
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get(args.targetUserId);
    if (!updated) {
      throwAppError("NOT_FOUND", "User not found");
    }
    return await toPublicUser(ctx, updated);
  },
});

export const deleteUserAsAdmin = mutation({
  args: {
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const adminUser = await requireAdminAuth(ctx);

    const targetUser = await ctx.db.get(args.targetUserId);
    if (!targetUser) {
      throwAppError("NOT_FOUND", "User not found");
    }

    // Prevent admins from deleting themselves
    if (adminUser._id === args.targetUserId) {
      throwAppError("FORBIDDEN", "Cannot delete your own account");
    }

    if (targetUser.profileImageStorageId) {
      await ctx.storage.delete(targetUser.profileImageStorageId);
    }

    await ctx.db.delete(args.targetUserId);
    return { success: true };
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdminAuth(ctx);

    const allUsers = await ctx.db.query("users").collect();
    const adminCount = allUsers.filter((u) => u.admin).length;
    const memohackStudents = allUsers.filter((u) => u.memohackStudent).length;

    const usersByClass: Record<string, number> = {};
    allUsers.forEach((u) => {
      usersByClass[u.class] = (usersByClass[u.class] || 0) + 1;
    });

    return {
      totalUsers: allUsers.length,
      adminCount,
      memohackStudents,
      usersByClass,
    };
  },
});

export const updateUserAsAdmin = mutation({
  args: {
    targetUserId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    class: v.optional(v.string()),
    memohackStudent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const adminUser = await requireAdminAuth(ctx);

    const targetUser = await ctx.db.get(args.targetUserId);
    if (!targetUser) {
      throwAppError("NOT_FOUND", "User not found");
    }

    // Prevent admins from editing their own details via this function
    if (adminUser._id === args.targetUserId) {
      throwAppError(
        "FORBIDDEN",
        "Cannot edit your own details as admin. Use the regular update function.",
      );
    }

    validateOptionalProfilePatch({
      email: args.email,
      name: args.name,
      phone: args.phone,
      image: args.image,
      class: args.class,
    });

    const hasUpdate =
      args.name !== undefined ||
      args.email !== undefined ||
      args.phone !== undefined ||
      args.image !== undefined ||
      args.class !== undefined ||
      args.memohackStudent !== undefined;

    if (!hasUpdate) {
      throwAppError("INVALID_INPUT", "Provide at least one field to update");
    }

    const nextEmail = args.email !== undefined ? args.email.trim() : undefined;
    // If changing email, check if it's unique
    if (nextEmail !== undefined && nextEmail !== targetUser.email) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", nextEmail))
        .first();
      if (existingUser) {
        throwAppError("DUPLICATE", "Email already in use");
      }
    }

    type Patchable = Pick<
      Doc<"users">,
      | "email"
      | "name"
      | "phone"
      | "image"
      | "class"
      | "memohackStudent"
      | "profileImageStorageId"
    >;

    const patch: Partial<Patchable> & { updatedAt: number } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) patch.name = args.name.trim();
    if (nextEmail !== undefined) patch.email = nextEmail;
    if (args.phone !== undefined) patch.phone = args.phone.trim();
    if (args.image !== undefined) {
      if (targetUser.profileImageStorageId) {
        await ctx.storage.delete(targetUser.profileImageStorageId);
      }
      patch.image = args.image.trim();
      patch.profileImageStorageId = undefined;
    }
    if (args.class !== undefined) patch.class = args.class.trim();
    if (args.memohackStudent !== undefined)
      patch.memohackStudent = args.memohackStudent;

    await ctx.db.patch(args.targetUserId, patch);

    const updated = await ctx.db.get(args.targetUserId);
    if (!updated) {
      throwAppError("NOT_FOUND", "User not found");
    }
    return await toPublicUser(ctx, updated);
  },
});
