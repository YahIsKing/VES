"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Copy, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function InvitesPage() {
  const user = useQuery(api.users.me);
  const invites = useQuery(api.invites.myInvites, user ? {} : "skip");
  const createInvite = useMutation(api.invites.createInvite);
  const revokeInvite = useMutation(api.invites.revokeInvite);

  const [isCreating, setIsCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCreateInvite = async () => {
    setIsCreating(true);
    try {
      const result = await createInvite({
        email: email || undefined,
      });
      toast.success(`Invite created: ${result.code}`);
      setEmail("");
      setDialogOpen(false);
    } catch {
      toast.error("Failed to create invite");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    const inviteUrl = `${window.location.origin}/invite/${code}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(code);
    toast.success("Invite link copied!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRevoke = async (inviteId: string) => {
    if (!confirm("Are you sure you want to revoke this invite?")) return;
    try {
      await revokeInvite({ inviteId: inviteId as Id<"invites"> });
      toast.success("Invite revoked");
    } catch {
      toast.error("Failed to revoke invite");
    }
  };

  const statusColors = {
    active: "bg-green-500/10 text-green-500 border-green-500/20",
    used: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    expired: "bg-muted text-muted-foreground/70 border-border",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invites</h1>
          <p className="text-muted-foreground">
            Invite others to join the VES community
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Invite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Invite</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="person@example.com"
                />
                <p className="text-xs text-muted-foreground/70">
                  Leave blank for a general invite anyone can use
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateInvite} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Invite"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invites List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Your Invites</CardTitle>
        </CardHeader>
        <CardContent>
          {invites === undefined ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : invites.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No invites yet. Create one to invite others!
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite._id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <code className="rounded bg-muted px-2 py-1 font-mono text-sm text-foreground">
                        {invite.code}
                      </code>
                      <Badge
                        variant="outline"
                        className={
                          invite.isExpired
                            ? statusColors.expired
                            : statusColors[invite.status]
                        }
                      >
                        {invite.isExpired ? "expired" : invite.status}
                      </Badge>
                    </div>
                    {invite.email && (
                      <p className="text-sm text-muted-foreground">
                        For: {invite.email}
                      </p>
                    )}
                    {invite.usedByName && (
                      <p className="text-sm text-muted-foreground">
                        Used by: {invite.usedByName}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/70">
                      Expires:{" "}
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {invite.status === "active" && !invite.isExpired && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCode(invite.code)}
                        >
                          {copiedCode === invite.code ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevoke(invite._id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
