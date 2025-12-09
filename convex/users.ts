import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getCurrentUser, requireUser, requireAdmin } from "./auth";

// Get the current authenticated user
export const me = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// Get a user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db.get(args.userId);
  },
});

// List all active members
export const listMembers = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

// Create or update user from Clerk webhook
export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      });
      return existingUser._id;
    } else {
      // Create new user (pending status until invite is used)
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        role: "member",
        status: "pending", // Will be activated when they use an invite
        joinedAt: Date.now(),
      });
    }
  },
});

// Delete user from Clerk webhook
export const deleteFromClerk = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

// Activate a user (called after using invite)
export const activateUser = internalMutation({
  args: {
    userId: v.id("users"),
    invitedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      status: "active",
      invitedBy: args.invitedBy,
    });
  },
});

// Admin: Update user role
export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

// Admin: Suspend/unsuspend user
export const setUserStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(
      v.literal("active"),
      v.literal("pending"),
      v.literal("suspended")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.userId, { status: args.status });
  },
});

// Seed the first admin user - call this once to bootstrap the system
// This creates or updates a user as active admin based on their Clerk identity
export const seedAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be signed in to seed admin");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existingUser) {
      // Update to admin and active
      await ctx.db.patch(existingUser._id, {
        role: "admin",
        status: "active",
        email: identity.email ?? existingUser.email,
        name: identity.name ?? existingUser.name,
        imageUrl: identity.pictureUrl ?? existingUser.imageUrl,
      });
      return { success: true, userId: existingUser._id, action: "updated" };
    } else {
      // Create new admin user
      const userId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: identity.email ?? "",
        name: identity.name ?? identity.email ?? "Admin",
        imageUrl: identity.pictureUrl,
        role: "admin",
        status: "active",
        joinedAt: Date.now(),
      });
      return { success: true, userId, action: "created" };
    }
  },
});
