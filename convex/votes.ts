import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./auth";

// Get my vote for an acquisition
export const getMyVote = query({
  args: { acquisitionId: v.id("acquisitionTargets") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const vote = await ctx.db
      .query("votes")
      .withIndex("by_acquisition_and_user", (q) =>
        q.eq("acquisitionId", args.acquisitionId).eq("userId", user._id)
      )
      .unique();

    return vote;
  },
});

// Get all votes for an acquisition
export const getVotesForAcquisition = query({
  args: { acquisitionId: v.id("acquisitionTargets") },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    const votes = await ctx.db
      .query("votes")
      .withIndex("by_acquisitionId", (q) =>
        q.eq("acquisitionId", args.acquisitionId)
      )
      .collect();

    const upvotes = votes.filter((v) => v.vote === "up").length;
    const downvotes = votes.filter((v) => v.vote === "down").length;

    return {
      upvotes,
      downvotes,
      total: votes.length,
      score: upvotes - downvotes,
    };
  },
});

// Cast a vote
export const castVote = mutation({
  args: {
    acquisitionId: v.id("acquisitionTargets"),
    vote: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Check acquisition exists
    const acquisition = await ctx.db.get(args.acquisitionId);
    if (!acquisition) {
      throw new Error("Acquisition not found");
    }

    // Check for existing vote
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_acquisition_and_user", (q) =>
        q.eq("acquisitionId", args.acquisitionId).eq("userId", user._id)
      )
      .unique();

    if (existingVote) {
      // Update existing vote
      await ctx.db.patch(existingVote._id, {
        vote: args.vote,
        votedAt: Date.now(),
      });
      return existingVote._id;
    } else {
      // Create new vote
      return await ctx.db.insert("votes", {
        acquisitionId: args.acquisitionId,
        userId: user._id,
        vote: args.vote,
        votedAt: Date.now(),
      });
    }
  },
});

// Remove a vote
export const removeVote = mutation({
  args: { acquisitionId: v.id("acquisitionTargets") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const vote = await ctx.db
      .query("votes")
      .withIndex("by_acquisition_and_user", (q) =>
        q.eq("acquisitionId", args.acquisitionId).eq("userId", user._id)
      )
      .unique();

    if (vote) {
      await ctx.db.delete(vote._id);
    }
  },
});
