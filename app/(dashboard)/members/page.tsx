"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Shield } from "lucide-react";

export default function MembersPage() {
  const currentUser = useQuery(api.users.me);
  const members = useQuery(api.users.listMembers, currentUser ? {} : "skip");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Members</h1>
        <p className="text-muted-foreground">
          The community working together to conquer Babylon
        </p>
      </div>

      {/* Stats */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {members?.length ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Members</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Grid */}
      {members === undefined ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : members.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No members yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card
              key={member._id}
              className="border-border bg-card"
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.imageUrl} alt={member.name} />
                    <AvatarFallback className="bg-muted text-foreground">
                      {member.name?.charAt(0).toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {member.name}
                      </h3>
                      {member.role === "admin" && (
                        <Shield className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {member.email}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          member.role === "admin"
                            ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }
                      >
                        {member.role}
                      </Badge>
                      {member._id === currentUser?._id && (
                        <Badge
                          variant="outline"
                          className="bg-blue-500/10 text-blue-500 border-blue-500/20"
                        >
                          You
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground/70">
                    Joined{" "}
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
