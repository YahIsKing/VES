"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SetupPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const seedAdmin = useMutation(api.users.seedAdmin);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSeed = async () => {
    setStatus("loading");
    try {
      const result = await seedAdmin({});
      setStatus("success");
      setMessage(`Admin account ${result.action}! Redirecting...`);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed to seed admin");
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please sign in first to set up your admin account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader>
          <CardTitle className="text-center text-foreground">VES Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Signed in as:</p>
            <p className="font-semibold text-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>

          {status === "idle" && (
            <Button onClick={handleSeed} className="w-full">
              Create Admin Account
            </Button>
          )}

          {status === "loading" && (
            <p className="text-center text-muted-foreground">Setting up...</p>
          )}

          {status === "success" && (
            <p className="text-center text-green-500">{message}</p>
          )}

          {status === "error" && (
            <div className="space-y-2">
              <p className="text-center text-red-500">{message}</p>
              <Button onClick={handleSeed} variant="outline" className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
