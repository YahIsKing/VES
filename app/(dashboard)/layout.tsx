"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useQuery(api.users.me);
  const router = useRouter();

  // Redirect if user is not active
  useEffect(() => {
    if (user === null) {
      // User not found in Convex - they need to sign up or wait for webhook
      return;
    }
    if (user && user.status !== "active") {
      // User exists but is not active - need to use invite
      router.push("/");
    }
  }, [user, router]);

  // Loading state
  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Not active - show message
  if (user && user.status !== "active") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Access Pending</h1>
          <p className="mt-2 text-muted-foreground">
            Your account is pending activation. Please use an invite link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      <Toaster />
    </div>
  );
}
