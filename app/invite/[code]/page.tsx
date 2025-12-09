"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { isSignedIn, isLoaded } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const invite = useQuery(api.invites.getInviteByCode, { code });
  const currentUser = useQuery(api.users.me);
  const redeemInvite = useMutation(api.invites.useInvite);

  // Auto-use invite when signed in
  useEffect(() => {
    async function activateInvite() {
      if (isSignedIn && currentUser && invite && invite.status === "active") {
        if (currentUser.status === "active") {
          // Already active, redirect to dashboard
          router.push("/dashboard");
          return;
        }

        try {
          await redeemInvite({ code });
          setSuccess(true);
          setTimeout(() => router.push("/dashboard"), 2000);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to use invite");
        }
      }
    }

    activateInvite();
  }, [isSignedIn, currentUser, invite, code, redeemInvite, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (invite === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Checking invite...</div>
      </div>
    );
  }

  if (invite === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Invalid Invite</h1>
          <p className="mt-2 text-muted-foreground">
            This invite code does not exist.
          </p>
        </div>
      </div>
    );
  }

  if (invite.status === "expired" || invite.status === "used") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-yellow-500">
            {invite.status === "expired" ? "Invite Expired" : "Invite Used"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {invite.status === "expired"
              ? "This invite has expired."
              : "This invite has already been used."}
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-500">Welcome to VES!</h1>
          <p className="mt-2 text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Error</h1>
          <p className="mt-2 text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Show invite details and sign up options
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">VES</h1>
          <p className="mt-1 text-sm text-muted-foreground">Value Exchange System</p>
        </div>

        <div className="mt-8 rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">You have been invited by</p>
          <p className="text-lg font-semibold text-foreground">
            {invite.creatorName}
          </p>
        </div>

        {isSignedIn ? (
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">Activating your account...</p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <SignUpButton
              mode="modal"
              forceRedirectUrl={`/invite/${code}`}
            >
              <button className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90">
                Create Account
              </button>
            </SignUpButton>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <SignInButton
                mode="modal"
                forceRedirectUrl={`/invite/${code}`}
              >
                <button className="text-foreground underline hover:no-underline">
                  Sign in
                </button>
              </SignInButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
