import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { requireUser, requireAdmin } from "./auth";

// Acquisition type validator
const acquisitionTypeValidator = v.union(
  v.literal("stock"),
  v.literal("land"),
  v.literal("company"),
  v.literal("livestock"),
  v.literal("ip"),
  v.literal("other")
);

// Status validator
const statusValidator = v.union(
  v.literal("proposed"),
  v.literal("approved"),
  v.literal("in_progress"),
  v.literal("acquired"),
  v.literal("rejected")
);

// Metadata validator
const metadataValidator = v.object({
  ticker: v.optional(v.string()),
  acreage: v.optional(v.number()),
  location: v.optional(v.string()),
  quantity: v.optional(v.number()),
  url: v.optional(v.string()),
});

// List all acquisitions
export const list = query({
  args: {
    status: v.optional(statusValidator),
    type: v.optional(acquisitionTypeValidator),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    let acquisitions;

    if (args.status) {
      acquisitions = await ctx.db
        .query("acquisitionTargets")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      acquisitions = await ctx.db.query("acquisitionTargets").collect();
    }

    // Filter by type if specified (since we can only use one index)
    let filtered = acquisitions;
    if (args.type) {
      filtered = acquisitions.filter((a) => a.type === args.type);
    }

    // Sort by proposedAt descending
    filtered.sort((a, b) => b.proposedAt - a.proposedAt);

    // Enrich with proposer info
    const enriched = await Promise.all(
      filtered.map(async (acquisition) => {
        const proposer = await ctx.db.get(acquisition.proposedBy);
        return {
          ...acquisition,
          proposerName: proposer?.name ?? "Unknown",
        };
      })
    );

    return enriched;
  },
});

// Get a single acquisition
export const get = query({
  args: { id: v.id("acquisitionTargets") },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    const acquisition = await ctx.db.get(args.id);
    if (!acquisition) return null;

    const proposer = await ctx.db.get(acquisition.proposedBy);

    // Get vote counts
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_acquisitionId", (q) => q.eq("acquisitionId", args.id))
      .collect();

    const upvotes = votes.filter((v) => v.vote === "up").length;
    const downvotes = votes.filter((v) => v.vote === "down").length;

    return {
      ...acquisition,
      proposerName: proposer?.name ?? "Unknown",
      upvotes,
      downvotes,
      voteScore: upvotes - downvotes,
    };
  },
});

// Propose a new acquisition
export const propose = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: acquisitionTypeValidator,
    metadata: metadataValidator,
    estimatedCost: v.optional(v.number()),
    unitsNeeded: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const acquisitionId = await ctx.db.insert("acquisitionTargets", {
      title: args.title,
      description: args.description,
      type: args.type,
      metadata: args.metadata,
      estimatedCost: args.estimatedCost,
      unitsNeeded: args.unitsNeeded,
      status: "proposed",
      proposedBy: user._id,
      proposedAt: Date.now(),
    });

    return acquisitionId;
  },
});

// Update an acquisition (proposer or admin)
export const update = mutation({
  args: {
    id: v.id("acquisitionTargets"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(acquisitionTypeValidator),
    metadata: v.optional(metadataValidator),
    estimatedCost: v.optional(v.number()),
    unitsNeeded: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const acquisition = await ctx.db.get(args.id);
    if (!acquisition) {
      throw new Error("Acquisition not found");
    }

    // Only proposer or admin can update
    if (acquisition.proposedBy !== user._id && user.role !== "admin") {
      throw new Error("Not authorized to update this acquisition");
    }

    // Only allow updates if status is proposed
    if (acquisition.status !== "proposed" && user.role !== "admin") {
      throw new Error("Can only update proposed acquisitions");
    }

    const updates: Partial<typeof acquisition> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.type !== undefined) updates.type = args.type;
    if (args.metadata !== undefined) updates.metadata = args.metadata;
    if (args.estimatedCost !== undefined)
      updates.estimatedCost = args.estimatedCost;
    if (args.unitsNeeded !== undefined) updates.unitsNeeded = args.unitsNeeded;

    await ctx.db.patch(args.id, updates);
  },
});

// Update acquisition status (admin only)
export const updateStatus = mutation({
  args: {
    id: v.id("acquisitionTargets"),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const acquisition = await ctx.db.get(args.id);
    if (!acquisition) {
      throw new Error("Acquisition not found");
    }

    const updates: Partial<typeof acquisition> = { status: args.status };

    if (args.status === "approved" && !acquisition.approvedAt) {
      updates.approvedAt = Date.now();
    }
    if (args.status === "acquired" && !acquisition.acquiredAt) {
      updates.acquiredAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);
  },
});

// Delete an acquisition (proposer if still proposed, or admin)
export const remove = mutation({
  args: { id: v.id("acquisitionTargets") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const acquisition = await ctx.db.get(args.id);
    if (!acquisition) {
      throw new Error("Acquisition not found");
    }

    // Only proposer (if proposed) or admin can delete
    const isProposer = acquisition.proposedBy === user._id;
    const isAdmin = user.role === "admin";
    const isProposed = acquisition.status === "proposed";

    if (!((isProposer && isProposed) || isAdmin)) {
      throw new Error("Not authorized to delete this acquisition");
    }

    // Delete associated votes
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_acquisitionId", (q) => q.eq("acquisitionId", args.id))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    // Delete associated comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_acquisitionId", (q) => q.eq("acquisitionId", args.id))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    await ctx.db.delete(args.id);
  },
});

// Internal mutation for seeding data (no auth required)
export const seed = internalMutation({
  args: {
    items: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        type: acquisitionTypeValidator,
        metadata: metadataValidator,
        estimatedCost: v.optional(v.number()),
        unitsNeeded: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Get the first admin user to use as proposer
    const adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (!adminUser) {
      throw new Error("No admin user found to seed data");
    }

    const ids = [];
    for (const item of args.items) {
      const id = await ctx.db.insert("acquisitionTargets", {
        title: item.title,
        description: item.description,
        type: item.type,
        metadata: item.metadata,
        estimatedCost: item.estimatedCost,
        unitsNeeded: item.unitsNeeded,
        status: "proposed",
        proposedBy: adminUser._id,
        proposedAt: Date.now(),
      });
      ids.push(id);
    }

    return ids;
  },
});
