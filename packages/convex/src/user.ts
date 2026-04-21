import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
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
  validateEmailForOtp,
  validateEmailOtp,
  validateOptionalProfilePatch,
  validatePasswordChange,
  validateSearchTerm,
  validateSigninFields,
  validateSignupFields,
} from "./_lib/userInput";

/** Re-export for call sites that only need auth checks (see aiChat). */
export { requireAuth } from "./_lib/auth";

export type { PublicUser };

type EmailOtpPurpose = "signup" | "password_change";
type CreatedEmailOtp = {
  otpId: Id<"emailOtps">;
  email: string;
  otp: string;
  expiresAt: number;
};
type EmailOtpRequestResponse = {
  success: true;
  expiresAt: number;
};

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const RESEND_EMAIL_ENDPOINT = "https://api.resend.com/emails";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function generateNumericOtp(): string {
  const bytes = crypto.getRandomValues(new Uint32Array(1));
  return String(100_000 + (bytes[0] % 900_000));
}

async function hashEmailOtp(
  email: string,
  purpose: EmailOtpPurpose,
  otp: string,
): Promise<string> {
  const pepper = process.env.JWT_PRIVATE_KEY_D ?? process.env.JWT_SECRET ?? "";
  const data = new TextEncoder().encode(
    `${normalizeEmail(email)}:${purpose}:${otp.trim()}:${pepper}`,
  );
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

async function createEmailOtp(
  ctx: MutationCtx,
  args: {
    email: string;
    purpose: EmailOtpPurpose;
    userId?: Id<"users">;
  },
) {
  const email = normalizeEmail(args.email);
  validateEmailForOtp(email);

  const now = Date.now();
  const latestOtp = await ctx.db
    .query("emailOtps")
    .withIndex("by_email_purpose", (q) =>
      q.eq("email", email).eq("purpose", args.purpose),
    )
    .order("desc")
    .first();

  if (
    latestOtp &&
    latestOtp.consumedAt === undefined &&
    latestOtp.expiresAt > now &&
    now - latestOtp.lastSentAt < OTP_RESEND_COOLDOWN_MS
  ) {
    throwAppError(
      "RATE_LIMITED",
      "Please wait a minute before requesting another code",
    );
  }

  const activeOtps = await ctx.db
    .query("emailOtps")
    .withIndex("by_email_purpose", (q) =>
      q.eq("email", email).eq("purpose", args.purpose),
    )
    .collect();

  for (const activeOtp of activeOtps) {
    if (activeOtp.consumedAt === undefined) {
      await ctx.db.patch(activeOtp._id, {
        consumedAt: now,
        updatedAt: now,
      });
    }
  }

  const otp = generateNumericOtp();
  const expiresAt = now + OTP_TTL_MS;
  const otpId = await ctx.db.insert("emailOtps", {
    email,
    ...(args.userId ? { userId: args.userId } : {}),
    purpose: args.purpose,
    generatedOtpHash: await hashEmailOtp(email, args.purpose, otp),
    attempts: 0,
    maxAttempts: OTP_MAX_ATTEMPTS,
    expiresAt,
    lastSentAt: now,
    createdAt: now,
    updatedAt: now,
  });

  return { otpId, email, otp, expiresAt };
}

async function verifyAndConsumeEmailOtp(
  ctx: MutationCtx,
  args: {
    email: string;
    purpose: EmailOtpPurpose;
    otp: string;
    userId?: Id<"users">;
  },
): Promise<void> {
  const email = normalizeEmail(args.email);
  validateEmailForOtp(email);
  validateEmailOtp(args.otp);

  const now = Date.now();
  const otpDoc = await ctx.db
    .query("emailOtps")
    .withIndex("by_email_purpose", (q) =>
      q.eq("email", email).eq("purpose", args.purpose),
    )
    .order("desc")
    .first();

  if (
    !otpDoc ||
    otpDoc.consumedAt !== undefined ||
    (args.userId !== undefined && otpDoc.userId !== args.userId)
  ) {
    throwAppError("INVALID_INPUT", "Invalid verification code");
  }

  if (otpDoc.expiresAt <= now) {
    await ctx.db.patch(otpDoc._id, {
      consumedAt: now,
      updatedAt: now,
    });
    throwAppError(
      "INVALID_INPUT",
      "Verification code expired. Please request a new code",
    );
  }

  if (otpDoc.attempts >= otpDoc.maxAttempts) {
    await ctx.db.patch(otpDoc._id, {
      consumedAt: now,
      updatedAt: now,
    });
    throwAppError(
      "INVALID_INPUT",
      "Too many incorrect attempts. Please request a new code",
    );
  }

  const expectedHash = await hashEmailOtp(email, args.purpose, args.otp);
  if (otpDoc.generatedOtpHash !== expectedHash) {
    const attempts = otpDoc.attempts + 1;
    await ctx.db.patch(otpDoc._id, {
      attempts,
      ...(attempts >= otpDoc.maxAttempts ? { consumedAt: now } : {}),
      updatedAt: now,
    });
    throwAppError("INVALID_INPUT", "Invalid verification code");
  }

  await ctx.db.patch(otpDoc._id, {
    consumedAt: now,
    updatedAt: now,
  });
}

function getOtpEmailContent(
  otp: string,
  purpose: EmailOtpPurpose,
): { subject: string; text: string; html: string } {
  const action =
    purpose === "signup"
      ? "finish creating your MemoHack account"
      : "change your MemoHack password";
  const subject =
    purpose === "signup"
      ? "Your MemoHack verification code"
      : "Your MemoHack password change code";
  const text = `Your MemoHack verification code is ${otp}. Use it to ${action}. This code expires in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">MemoHack verification</h2>
      <p style="margin: 0 0 16px;">Use this code to ${action}:</p>
      <p style="font-size: 32px; letter-spacing: 8px; font-weight: 700; margin: 0 0 16px;">${otp}</p>
      <p style="margin: 0; color: #4B5563;">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
    </div>
  `;
  return { subject, text, html };
}

async function sendOtpEmail(
  email: string,
  otp: string,
  purpose: EmailOtpPurpose,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "MemoHack <onboarding@resend.dev>";
  if (!apiKey) {
    throwAppError(
      "INVALID_INPUT",
      "Email service is not configured. Add RESEND_API_KEY in Convex env",
    );
  }

  const content = getOtpEmailContent(otp, purpose);
  const response = await fetch(RESEND_EMAIL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: content.subject,
      text: content.text,
      html: content.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Resend email failed:", response.status, body);
    throwAppError(
      "INVALID_INPUT",
      "Could not send verification email. Please try again",
    );
  }
}

export const requestSignupEmailOtp = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args): Promise<EmailOtpRequestResponse> => {
    const email = normalizeEmail(args.email);
    validateEmailForOtp(email);

    const otpResult: CreatedEmailOtp = await ctx.runMutation(
      internal.user.createSignupEmailOtp,
      { email },
    );

    try {
      await sendOtpEmail(email, otpResult.otp, "signup");
    } catch (error) {
      await ctx.runMutation(internal.user.cancelEmailOtp, {
        otpId: otpResult.otpId,
      });
      throw error;
    }

    return { success: true, expiresAt: otpResult.expiresAt };
  },
});

export const requestPasswordChangeEmailOtp = action({
  args: {},
  handler: async (ctx): Promise<EmailOtpRequestResponse> => {
    const userId = (await requireAuth(ctx)) as Id<"users">;
    const otpResult: CreatedEmailOtp = await ctx.runMutation(
      internal.user.createPasswordChangeEmailOtp,
      {
        userId,
      },
    );

    try {
      await sendOtpEmail(otpResult.email, otpResult.otp, "password_change");
    } catch (error) {
      await ctx.runMutation(internal.user.cancelEmailOtp, {
        otpId: otpResult.otpId,
      });
      throw error;
    }

    return { success: true, expiresAt: otpResult.expiresAt };
  },
});

export const requestPasswordResetEmailOtp = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args): Promise<EmailOtpRequestResponse> => {
    const email = normalizeEmail(args.email);
    validateEmailForOtp(email);

    const otpResult: CreatedEmailOtp | null = await ctx.runMutation(
      internal.user.createPasswordResetEmailOtp,
      { email },
    );

    if (!otpResult) {
      return { success: true, expiresAt: Date.now() + OTP_TTL_MS };
    }

    try {
      await sendOtpEmail(otpResult.email, otpResult.otp, "password_change");
    } catch (error) {
      await ctx.runMutation(internal.user.cancelEmailOtp, {
        otpId: otpResult.otpId,
      });
      throw error;
    }

    return { success: true, expiresAt: otpResult.expiresAt };
  },
});

export const createSignupEmailOtp = internalMutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    validateEmailForOtp(email);

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throwAppError("DUPLICATE", "User with this email already exists");
    }

    return await createEmailOtp(ctx, {
      email,
      purpose: "signup",
    });
  },
});

export const createPasswordChangeEmailOtp = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throwAppError("NOT_FOUND", "User not found");
    }

    return await createEmailOtp(ctx, {
      email: user.email,
      purpose: "password_change",
      userId: user._id,
    });
  },
});

export const createPasswordResetEmailOtp = internalMutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args): Promise<CreatedEmailOtp | null> => {
    const email = normalizeEmail(args.email);
    validateEmailForOtp(email);

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      return null;
    }

    return await createEmailOtp(ctx, {
      email: user.email,
      purpose: "password_change",
      userId: user._id,
    });
  },
});

export const cancelEmailOtp = internalMutation({
  args: {
    otpId: v.id("emailOtps"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const otp = await ctx.db.get(args.otpId);
    if (!otp || otp.consumedAt !== undefined) return { success: true };
    await ctx.db.patch(args.otpId, {
      consumedAt: now,
      updatedAt: now,
    });
    return { success: true };
  },
});

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
    emailOtp: v.string(),
    name: v.string(),
    phone: v.string(),
    image: v.optional(v.string()),
    profileImageStorageId: v.optional(v.id("_storage")),
    class: v.string(),
    memohackStudent: v.boolean(),
  },
  handler: async (ctx, args) => {
    validateSignupFields(args);

    const email = normalizeEmail(args.email);
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throwAppError("DUPLICATE", "User with this email already exists");
    }

    await verifyAndConsumeEmailOtp(ctx, {
      email,
      purpose: "signup",
      otp: args.emailOtp,
    });

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

    const email = normalizeEmail(args.email);
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
    newPassword: v.string(),
    emailOtp: v.string(),
  },
  handler: async (ctx, args) => {
    validatePasswordChange(args.newPassword);
    validateEmailOtp(args.emailOtp);

    const userId = await requireAuth(ctx);

    const user = await ctx.db.get(userId as Id<"users">);

    if (!user) {
      throwAppError("NOT_FOUND", "User not found");
    }

    await verifyAndConsumeEmailOtp(ctx, {
      email: user.email,
      purpose: "password_change",
      otp: args.emailOtp,
      userId: user._id,
    });

    const hashedNewPassword = await hashPassword(args.newPassword);
    await ctx.db.patch(userId as Id<"users">, {
      password: hashedNewPassword,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const resetPasswordWithEmailOtp = mutation({
  args: {
    email: v.string(),
    newPassword: v.string(),
    emailOtp: v.string(),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    validateEmailForOtp(email);
    validatePasswordChange(args.newPassword);
    validateEmailOtp(args.emailOtp);

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throwAppError("INVALID_INPUT", "Invalid verification code");
    }

    await verifyAndConsumeEmailOtp(ctx, {
      email: user.email,
      purpose: "password_change",
      otp: args.emailOtp,
      userId: user._id,
    });

    await ctx.db.patch(user._id, {
      password: await hashPassword(args.newPassword),
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
