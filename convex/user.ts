import { v } from "convex/values";
import { SignJWT, jwtVerify } from "jose";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function generateToken(userId: string): Promise<string> {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1095d')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

async function verifyToken(token: string): Promise<{ userId: string }> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as string };
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

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

async function generateSalt(): Promise<string> {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string): Promise<string> {
  const salt = await generateSalt();
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${salt}:${hashHex}`;
}

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [salt, hash] = hashedPassword.split(':');
  if (!salt || !hash) return false;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex === hash;
}

export const signup = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.string(),
    image: v.optional(v.string()),
    class: v.string(),
    memohackStudent: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await hashPassword(args.password);
    const now = Date.now();
    
    const userId = await ctx.db.insert("users", {
      email: args.email,
      password: hashedPassword,
      name: args.name,
      phone: args.phone,
      image: args.image || `https://eu.ui-avatars.com/api/?name=${args.name.replace(/\s+/g, '+')}&size=250`,
      class: args.class,
      memohackStudent: args.memohackStudent,
      admin: false,
      createdAt: now,
      updatedAt: now,
    });

    const user = await ctx.db.get(userId);

    const token = await generateToken(userId);
    return {
      user,
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
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const isValidPassword = await verifyPassword(args.password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid password");
    }

    const token = await generateToken(user._id);
    return {
      user,
      token,
    };
  },
});

export const getCurrentUser = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(args.token);
    
    const user = await ctx.db.get(userId as Id<"users">);
    return user;
  },
});

export const updateUser = mutation({
  args: {
    email: v.string(),
    token: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    class: v.optional(v.string()),
    memohackStudent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(args.token);
    
    const user = await ctx.db.get(userId as Id<"users">);

    if (!user) {
      throw new Error("User not found");
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(args).filter(([key, value]) => key !== 'token' && value !== undefined)
    );

    await ctx.db.patch(userId as Id<"users">, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(userId as Id<"users">);
  },
});

export const deleteUser = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(args.token);
    
    const user = await ctx.db.get(userId as Id<"users">);

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.delete(userId as Id<"users">);
    return { success: true };
  },
});

export const changePassword = mutation({
  args: {
    token: v.string(),
    oldPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(args.token);
    
    const user = await ctx.db.get(userId as Id<"users">);

    if (!user) {
      throw new Error("User not found");
    }

    const isValidOldPassword = await verifyPassword(args.oldPassword, user.password);
    if (!isValidOldPassword) {
      throw new Error("Invalid old password");
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
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminAuth(ctx, args.token);

    const users = await ctx.db.query("users").collect();
    
    // Remove passwords from response
    return users.map(u => ({
      ...u,
      password: undefined,
    }));
  },
});

export const getUsersByClass = query({
  args: {
    token: v.string(),
    class: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminAuth(ctx, args.token);

    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("class"), args.class))
      .collect();
    
    return users.map(u => ({
      ...u,
      password: undefined,
    }));
  },
});

export const searchUsers = query({
  args: {
    token: v.string(),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminAuth(ctx, args.token);

    const users = await ctx.db.query("users").collect();
    
    const searchLower = args.searchTerm.toLowerCase();
    const filtered = users.filter(u => 
      u.name.toLowerCase().includes(searchLower) || 
      u.email.toLowerCase().includes(searchLower)
    );
    
    return filtered.map(u => ({
      ...u,
      password: undefined,
    }));
  },
});

export const toggleUserAdminStatus = mutation({
  args: {
    token: v.string(),
    targetUserId: v.string(),
    admin: v.boolean(),
  },
  handler: async (ctx, args) => {
    const adminUser = await requireAdminAuth(ctx, args.token);

    const targetUser = await ctx.db.get(args.targetUserId as Id<"users">);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Prevent users from removing their own admin status
    if (adminUser._id === args.targetUserId && !args.admin) {
      throw new Error("Cannot remove your own admin status");
    }

    await ctx.db.patch(args.targetUserId as Id<"users">, {
      admin: args.admin,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.targetUserId as Id<"users">);
  },
});

export const deleteUserAsAdmin = mutation({
  args: {
    token: v.string(),
    targetUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const adminUser = await requireAdminAuth(ctx, args.token);

    const targetUser = await ctx.db.get(args.targetUserId as Id<"users">);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Prevent admins from deleting themselves
    if (adminUser._id === args.targetUserId) {
      throw new Error("Cannot delete your own account");
    }

    await ctx.db.delete(args.targetUserId as Id<"users">);
    return { success: true };
  },
});

export const getUserStats = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminAuth(ctx, args.token);

    const allUsers = await ctx.db.query("users").collect();
    const adminCount = allUsers.filter(u => u.admin).length;
    const memohackStudents = allUsers.filter(u => u.memohackStudent).length;
    
    const usersByClass: Record<string, number> = {};
    allUsers.forEach(u => {
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
    token: v.string(),
    targetUserId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    class: v.optional(v.string()),
    memohackStudent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const adminUser = await requireAdminAuth(ctx, args.token);

    const targetUser = await ctx.db.get(args.targetUserId as Id<"users">);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Prevent admins from editing their own details via this function
    if (adminUser._id === args.targetUserId) {
      throw new Error("Cannot edit your own details as admin. Use the regular update function.");
    }

    // If changing email, check if it's unique
    if (args.email && args.email !== targetUser.email) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .first();
      if (existingUser) {
        throw new Error("Email already in use");
      }
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.image !== undefined) updates.image = args.image;
    if (args.class !== undefined) updates.class = args.class;
    if (args.memohackStudent !== undefined) updates.memohackStudent = args.memohackStudent;

    updates.updatedAt = Date.now();

    await ctx.db.patch(args.targetUserId as Id<"users">, updates);

    const updated = await ctx.db.get(args.targetUserId as Id<"users">);
    return {
      ...updated,
      password: undefined,
    };
  },
});