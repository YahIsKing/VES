import { QueryCtx, MutationCtx } from "./_generated/server";

// Get the current user from Clerk identity
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  return user;
}

// Require a user to be authenticated and active
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("Unauthorized: Please sign in");
  }
  if (user.status !== "active") {
    throw new Error("Access denied: Your account is not active");
  }
  return user;
}

// Require admin role
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await requireUser(ctx);
  if (user.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}

// Get user by Clerk ID (for webhook sync)
export async function getUserByClerkId(ctx: QueryCtx | MutationCtx, clerkId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .unique();
}
