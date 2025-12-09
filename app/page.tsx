"use client";

import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="text-center">
        {/* POLOE Branding */}
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          POLOE
        </h1>

        {/* VES App */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          <span className="text-lg text-muted-foreground">VES</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Value Exchange System
        </p>

        {/* Auth Buttons */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <SignUpButton mode="modal">
            <Button size="lg">
              Create Account
            </Button>
          </SignUpButton>
          <SignInButton mode="modal">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </SignInButton>
        </div>
      </div>
    </div>
  );
}
