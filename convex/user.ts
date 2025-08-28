import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");

async function generateToken(email: string): Promise<string> {
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

async function verifyToken(token: string): Promise<{ email: string }> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { email: payload.email as string };
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

async function requireAuth(token: string) {
  if (!token) {
    throw new Error("Authentication required");
  }
  
  const decoded = await verifyToken(token);
  return decoded.email;
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
      createdAt: now,
      updatedAt: now,
    });

    const user = await ctx.db.get(userId);

    const token = await generateToken(args.email);
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

    const token = await generateToken(user.email);
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
    const authenticatedEmail = await requireAuth(args.token);
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authenticatedEmail))
      .first();
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
  },
  handler: async (ctx, args) => {
    const authenticatedEmail = await requireAuth(args.token);
    
    // Ensure user can only update their own profile
    if (authenticatedEmail !== args.email) {
      throw new Error("Unauthorized: Cannot update another user's profile");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(args).filter(([key, value]) => key !== 'email' && key !== 'token' && value !== undefined)
    );

    await ctx.db.patch(user._id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(user._id);
  },
});

export const deleteUser = mutation({
  args: {
    email: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const authenticatedEmail = await requireAuth(args.token);
    
    // Ensure user can only delete their own account
    if (authenticatedEmail !== args.email) {
      throw new Error("Unauthorized: Cannot delete another user's account");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.delete(user._id);
    return { success: true };
  },
});

export const changePassword = mutation({
  args: {
    email: v.string(),
    token: v.string(),
    oldPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const authenticatedEmail = await requireAuth(args.token);
    
    // Ensure user can only change their own password
    if (authenticatedEmail !== args.email) {
      throw new Error("Unauthorized: Cannot change another user's password");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const isValidOldPassword = await verifyPassword(args.oldPassword, user.password);
    if (!isValidOldPassword) {
      throw new Error("Invalid old password");
    }

    const hashedNewPassword = await hashPassword(args.newPassword);
    await ctx.db.patch(user._id, {
      password: hashedNewPassword,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});