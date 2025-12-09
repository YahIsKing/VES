import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser, getCurrentUser } from "./auth";
import { internal } from "./_generated/api";

// Generate a random invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars like O, 0, I, 1
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new invite
export const createInvite = mutation({
  args: {
    email: v.optional(v.string()),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const expiresAt =
      Date.now() + (args.expiresInDays ?? 30) * 24 * 60 * 60 * 1000;

    const code = generateInviteCode();

    const inviteId = await ctx.db.insert("invites", {
      code,
      createdBy: user._id,
      email: args.email,
      expiresAt,
      status: "active",
    });

    return { inviteId, code };
  },
});

// Get invite by code (public - for validation before sign up)
export const getInviteByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!invite) return null;

    // Check if expired
    if (invite.expiresAt < Date.now()) {
      return { ...invite, status: "expired" as const };
    }

    // Get creator info
    const creator = await ctx.db.get(invite.createdBy);

    return {
      ...invite,
      creatorName: creator?.name ?? "Unknown",
    };
  },
});

// Use an invite (after sign up)
export const useInvite = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Must be signed in to use invite");
    }

    // Already active?
    if (user.status === "active") {
      return { success: true, message: "Already active" };
    }

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!invite) {
      throw new Error("Invalid invite code");
    }

    if (invite.status !== "active") {
      throw new Error("Invite has already been used");
    }

    if (invite.expiresAt < Date.now()) {
      throw new Error("Invite has expired");
    }

    // If email-specific invite, verify email matches
    if (invite.email && invite.email !== user.email) {
      throw new Error("This invite is for a different email address");
    }

    // Mark invite as used
    await ctx.db.patch(invite._id, {
      status: "used",
      usedBy: user._id,
      usedAt: Date.now(),
    });

    // Activate the user
    await ctx.runMutation(internal.users.activateUser, {
      userId: user._id,
      invitedBy: invite.createdBy,
    });

    return { success: true, message: "Welcome to VES!" };
  },
});

// Get my invites
export const myInvites = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const invites = await ctx.db
      .query("invites")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", user._id))
      .collect();

    // Enrich with used by info
    const enriched = await Promise.all(
      invites.map(async (invite) => {
        let usedByUser = null;
        if (invite.usedBy) {
          usedByUser = await ctx.db.get(invite.usedBy);
        }
        return {
          ...invite,
          usedByName: usedByUser?.name,
          isExpired: invite.expiresAt < Date.now(),
        };
      })
    );

    return enriched;
  },
});

// Revoke an invite
export const revokeInvite = mutation({
  args: { inviteId: v.id("invites") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new Error("Invite not found");
    }

    // Only creator or admin can revoke
    if (invite.createdBy !== user._id && user.role !== "admin") {
      throw new Error("Not authorized to revoke this invite");
    }

    if (invite.status === "used") {
      throw new Error("Cannot revoke a used invite");
    }

    await ctx.db.patch(args.inviteId, { status: "expired" });
  },
});
