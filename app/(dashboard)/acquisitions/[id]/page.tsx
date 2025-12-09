"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  MapPin,
  Hash,
  DollarSign,
  Calendar,
  User,
  Trash2,
  Pencil,
  TrendingUp,
  Building,
  Landmark,
  Tractor,
  Lightbulb,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusConfig = {
  proposed: {
    label: "Proposed",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    progress: 20,
    progressColor: "bg-amber-400",
  },
  approved: {
    label: "Approved",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    progress: 50,
    progressColor: "bg-emerald-400",
  },
  in_progress: {
    label: "In Progress",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    progress: 75,
    progressColor: "bg-blue-400",
  },
  acquired: {
    label: "Acquired",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    progress: 100,
    progressColor: "bg-violet-400",
  },
  rejected: {
    label: "Rejected",
    badge: "bg-red-50 text-red-700 border-red-200",
    progress: 0,
    progressColor: "bg-red-400",
  },
};

const typeConfig = {
  stock: { label: "Stock", icon: TrendingUp },
  land: { label: "Land", icon: Landmark },
  company: { label: "Company", icon: Building },
  livestock: { label: "Livestock", icon: Tractor },
  ip: { label: "Intellectual Property", icon: Lightbulb },
  other: { label: "Other", icon: MoreHorizontal },
};

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-sm font-medium text-foreground">{children}</div>
      </div>
    </div>
  );
}

export default function AcquisitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as Id<"acquisitionTargets">;

  const acquisition = useQuery(api.acquisitions.get, { id });
  const currentUser = useQuery(api.users.me);
  const myVote = useQuery(api.votes.getMyVote, { acquisitionId: id });
  const castVote = useMutation(api.votes.castVote);
  const removeVote = useMutation(api.votes.removeVote);
  const updateStatus = useMutation(api.acquisitions.updateStatus);
  const deleteAcquisition = useMutation(api.acquisitions.remove);

  if (acquisition === undefined) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (acquisition === null) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Acquisition not found</p>
        <Link href="/acquisitions">
          <Button variant="outline" size="sm" className="mt-4">
            Back to acquisitions
          </Button>
        </Link>
      </div>
    );
  }

  const handleVote = async (vote: "up" | "down") => {
    try {
      if (myVote?.vote === vote) {
        await removeVote({ acquisitionId: id });
        toast.success("Vote removed");
      } else {
        await castVote({ acquisitionId: id, vote });
        toast.success(vote === "up" ? "Upvoted!" : "Downvoted");
      }
    } catch {
      toast.error("Failed to vote");
    }
  };

  const handleStatusChange = async (
    status: "proposed" | "approved" | "in_progress" | "acquired" | "rejected"
  ) => {
    try {
      await updateStatus({ id, status });
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this acquisition?")) return;
    try {
      await deleteAcquisition({ id });
      toast.success("Acquisition deleted");
      router.push("/acquisitions");
    } catch {
      toast.error("Failed to delete acquisition");
    }
  };

  const isAdmin = currentUser?.role === "admin";
  const isProposer = currentUser?._id === acquisition.proposedBy;
  const canEdit = isAdmin || (isProposer && acquisition.status === "proposed");
  const canDelete = isAdmin || (isProposer && acquisition.status === "proposed");

  const status = statusConfig[acquisition.status];
  const typeInfo = typeConfig[acquisition.type];
  const TypeIcon = typeInfo.icon;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/acquisitions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to acquisitions
        </Link>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
              <TypeIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {acquisition.title}
                </h1>
                <Badge variant="outline" className={status.badge}>
                  {status.label}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {typeInfo.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Link href={`/acquisitions/${id}/edit`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </Link>
            )}
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium tabular-nums text-foreground">
            {status.progress}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${status.progressColor}`}
            style={{ width: `${status.progress}%` }}
          />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Description */}
          <section>
            <h2 className="text-sm font-medium text-foreground">Description</h2>
            <div className="mt-3 rounded-lg border border-border bg-card p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                {acquisition.description}
              </p>
            </div>
          </section>

          {/* Purchase History */}
          <section>
            <h2 className="text-sm font-medium text-foreground">Purchase History</h2>
            <div className="mt-3 rounded-lg border border-border bg-card">
              <div className="divide-y divide-border">
                {/* Placeholder - no purchases yet */}
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No purchases recorded yet
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Admin Controls */}
          {isAdmin && (
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-sm font-medium text-foreground">Admin Controls</h3>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {(
                    ["proposed", "approved", "in_progress", "acquired", "rejected"] as const
                  ).map((s) => {
                    const config = statusConfig[s];
                    const isActive = acquisition.status === s;
                    return (
                      <Button
                        key={s}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className={isActive ? "" : "text-muted-foreground"}
                        onClick={() => handleStatusChange(s)}
                      >
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Voting Card */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-center">
              <div
                className={`text-3xl font-bold tabular-nums ${
                  acquisition.voteScore > 0
                    ? "text-emerald-600"
                    : acquisition.voteScore < 0
                      ? "text-red-600"
                      : "text-foreground"
                }`}
              >
                {acquisition.voteScore > 0 ? "+" : ""}
                {acquisition.voteScore}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Vote Score</div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className={`flex-1 gap-1.5 ${
                  myVote?.vote === "up"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : ""
                }`}
                onClick={() => handleVote("up")}
              >
                <ThumbsUp className="h-4 w-4" />
                {acquisition.upvotes}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`flex-1 gap-1.5 ${
                  myVote?.vote === "down"
                    ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    : ""
                }`}
                onClick={() => handleVote("down")}
              >
                <ThumbsDown className="h-4 w-4" />
                {acquisition.downvotes}
              </Button>
            </div>
          </div>

          {/* Details Card */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-medium text-foreground">Details</h3>
            </div>
            <div className="space-y-4 p-4">
              {acquisition.estimatedCost && (
                <DetailRow icon={DollarSign} label="Estimated Cost">
                  ${(acquisition.estimatedCost / 100).toLocaleString()}
                </DetailRow>
              )}

              {acquisition.unitsNeeded && (
                <DetailRow icon={Hash} label="Units Needed">
                  {acquisition.unitsNeeded.toLocaleString()}
                </DetailRow>
              )}

              {acquisition.metadata.ticker && (
                <DetailRow icon={TrendingUp} label="Ticker">
                  {acquisition.metadata.ticker}
                </DetailRow>
              )}

              {acquisition.metadata.location && (
                <DetailRow icon={MapPin} label="Location">
                  {acquisition.metadata.location}
                </DetailRow>
              )}

              {acquisition.metadata.acreage && (
                <DetailRow icon={Landmark} label="Acreage">
                  {acquisition.metadata.acreage.toLocaleString()} acres
                </DetailRow>
              )}

              {acquisition.metadata.quantity && (
                <DetailRow icon={Hash} label="Quantity">
                  {acquisition.metadata.quantity.toLocaleString()}
                </DetailRow>
              )}

              {acquisition.metadata.url && (
                <DetailRow icon={ExternalLink} label="External Link">
                  <a
                    href={acquisition.metadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Resource
                  </a>
                </DetailRow>
              )}
            </div>
          </div>

          {/* Proposer Info */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-medium text-foreground">Proposal Info</h3>
            </div>
            <div className="space-y-4 p-4">
              <DetailRow icon={User} label="Proposed by">
                {acquisition.proposerName}
              </DetailRow>
              <DetailRow icon={Calendar} label="Proposed on">
                {new Date(acquisition.proposedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </DetailRow>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
