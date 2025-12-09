import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - synced with Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("member")),
    status: v.union(
      v.literal("active"),
      v.literal("pending"),
      v.literal("suspended")
    ),
    invitedBy: v.optional(v.id("users")),
    joinedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  // Invites table
  invites: defineTable({
    code: v.string(),
    createdBy: v.id("users"),
    email: v.optional(v.string()), // Optional: specific email invite
    usedBy: v.optional(v.id("users")),
    usedAt: v.optional(v.number()),
    expiresAt: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("used"),
      v.literal("expired")
    ),
  })
    .index("by_code", ["code"])
    .index("by_createdBy", ["createdBy"])
    .index("by_status", ["status"]),

  // Acquisition Targets
  acquisitionTargets: defineTable({
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("stock"),
      v.literal("land"),
      v.literal("company"),
      v.literal("livestock"),
      v.literal("ip"),
      v.literal("other")
    ),
    // Type-specific metadata
    metadata: v.object({
      ticker: v.optional(v.string()), // For stocks
      acreage: v.optional(v.number()), // For land
      location: v.optional(v.string()), // For land/companies
      quantity: v.optional(v.number()), // For livestock/general units
      url: v.optional(v.string()), // External reference
    }),
    estimatedCost: v.optional(v.number()), // Total estimated cost in cents
    unitsNeeded: v.optional(v.number()), // How many units to acquire
    status: v.union(
      v.literal("proposed"),
      v.literal("approved"),
      v.literal("in_progress"),
      v.literal("acquired"),
      v.literal("rejected")
    ),
    proposedBy: v.id("users"),
    proposedAt: v.number(),
    approvedAt: v.optional(v.number()),
    acquiredAt: v.optional(v.number()),
    priority: v.optional(v.number()), // For ordering (lower = higher priority)
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_proposedBy", ["proposedBy"]),

  // Votes on acquisition targets
  votes: defineTable({
    acquisitionId: v.id("acquisitionTargets"),
    userId: v.id("users"),
    vote: v.union(v.literal("up"), v.literal("down")),
    votedAt: v.number(),
  })
    .index("by_acquisitionId", ["acquisitionId"])
    .index("by_userId", ["userId"])
    .index("by_acquisition_and_user", ["acquisitionId", "userId"]),

  // Comments/Discussion on targets (for future)
  comments: defineTable({
    acquisitionId: v.id("acquisitionTargets"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    parentId: v.optional(v.id("comments")), // For replies
  })
    .index("by_acquisitionId", ["acquisitionId"])
    .index("by_userId", ["userId"])
    .index("by_parentId", ["parentId"]),

  // Treasury Contributions (for post-MVP)
  contributions: defineTable({
    userId: v.id("users"),
    amount: v.number(), // In cents
    recordedAt: v.number(),
    recordedBy: v.id("users"), // Admin who recorded it
    notes: v.optional(v.string()),
    method: v.union(
      v.literal("cash"),
      v.literal("check"),
      v.literal("transfer"),
      v.literal("other")
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_recordedAt", ["recordedAt"]),

  // Treasury Deployments (for post-MVP)
  deployments: defineTable({
    acquisitionId: v.id("acquisitionTargets"),
    amount: v.number(), // In cents
    deployedAt: v.number(),
    deployedBy: v.id("users"), // Admin who recorded it
    notes: v.optional(v.string()),
  })
    .index("by_acquisitionId", ["acquisitionId"])
    .index("by_deployedAt", ["deployedAt"]),
});
