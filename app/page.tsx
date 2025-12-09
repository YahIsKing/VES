"use client";

import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Swords, Target, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const user = useQuery(api.users.me);
  const router = useRouter();

  // Redirect to dashboard if signed in and active
  useEffect(() => {
    if (isSignedIn && user?.status === "active") {
      router.push("/dashboard");
    }
  }, [isSignedIn, user, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent" />
        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
          <div className="flex justify-center mb-6">
            <Swords className="h-16 w-16 text-yellow-500" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
            VES
          </h1>
          <p className="mt-2 text-xl text-muted-foreground sm:text-2xl">
            Value Exchange System
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-foreground/80">
            A weapon for conquering Babylon. Unite Christian capital to acquire
            assets, companies, and resources that strengthen the Kingdom.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isSignedIn ? (
              user?.status === "pending" ? (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Your account is pending activation.
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    You need an invite link to join VES.
                  </p>
                </div>
              ) : (
                <Button size="lg" onClick={() => router.push("/dashboard")}>
                  Go to Dashboard
                </Button>
              )
            ) : (
              <>
                <SignUpButton mode="modal">
                  <Button size="lg" className="gap-2 bg-yellow-600 hover:bg-yellow-700">
                    <Shield className="h-4 w-4" />
                    Join VES
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </SignInButton>
              </>
            )}
          </div>

          <p className="mt-6 text-sm text-muted-foreground/70">
            VES is invite-only. Contact a member to get access.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card/50 p-6">
            <Target className="h-10 w-10 text-yellow-500" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Target Acquisitions
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Propose and vote on assets to acquire: stocks, land, companies,
              livestock, and intellectual property.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card/50 p-6">
            <Users className="h-10 w-10 text-yellow-500" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              United Community
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Christians working together as one coordinated force, pooling
              resources to outmaneuver divided competitors.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card/50 p-6">
            <Swords className="h-10 w-10 text-yellow-500" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Conquer Babylon
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Extract value from the world&apos;s systems and convert it into
              Kingdom resources under Christian stewardship.
            </p>
          </div>
        </div>
      </div>

      {/* Vision */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-foreground">The Vision</h2>
          <p className="mt-4 text-foreground/80 leading-relaxed">
            Every company brought into this system is not just owned, but operated
            to produce rapid and multiplying value, transforming Babylon&apos;s
            strongest engines of profit into tools that serve Christ&apos;s people.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            VES becomes the means by which Christians work together against the
            empire of money-hungry elites, building an incorruptible framework of
            ownership of all value in the world under Christ&apos;s reign.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-5xl px-6 text-center text-sm text-muted-foreground">
          VES - Value Exchange System
        </div>
      </footer>
    </div>
  );
}
