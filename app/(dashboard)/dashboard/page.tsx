"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Users, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const user = useQuery(api.users.me);
  // Skip queries until we confirm user is authenticated
  const acquisitions = useQuery(
    api.acquisitions.list,
    user ? {} : "skip"
  );
  const members = useQuery(
    api.users.listMembers,
    user ? {} : "skip"
  );

  const stats = {
    totalAcquisitions: acquisitions?.length ?? 0,
    approvedAcquisitions:
      acquisitions?.filter((a) => a.status === "approved").length ?? 0,
    totalMembers: members?.length ?? 0,
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.name?.split(" ")[0] ?? "Soldier"}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with VES today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Target Acquisitions
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalAcquisitions}
            </div>
            <p className="text-xs text-muted-foreground/70">
              {stats.approvedAcquisitions} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalMembers}
            </div>
            <p className="text-xs text-muted-foreground/70">In the community</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mission Status
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Active</div>
            <p className="text-xs text-muted-foreground/70">Conquering Babylon</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/acquisitions/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Propose Acquisition
          </Button>
        </Link>
        <Link href="/acquisitions">
          <Button variant="outline" className="gap-2">
            <Target className="h-4 w-4" />
            View All Targets
          </Button>
        </Link>
        <Link href="/invites">
          <Button variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            Invite Members
          </Button>
        </Link>
      </div>

      {/* Recent Acquisitions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Acquisition Targets</CardTitle>
        </CardHeader>
        <CardContent>
          {acquisitions === undefined ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : acquisitions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No acquisitions yet.</p>
              <Link href="/acquisitions/new">
                <Button className="mt-4">Propose the first one</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {acquisitions.slice(0, 5).map((acquisition) => (
                <Link
                  key={acquisition._id}
                  href={`/acquisitions/${acquisition._id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent/50">
                    <div>
                      <h3 className="font-medium text-foreground">
                        {acquisition.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {acquisition.type} • {acquisition.status}
                      </p>
                    </div>
                    {acquisition.estimatedCost && (
                      <span className="text-sm text-muted-foreground">
                        ${(acquisition.estimatedCost / 100).toLocaleString()}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
