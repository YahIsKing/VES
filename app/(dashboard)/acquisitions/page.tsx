"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  TrendingUp,
  Building,
  Landmark,
  Tractor,
  Lightbulb,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const typeIcons = {
  stock: TrendingUp,
  land: Landmark,
  company: Building,
  livestock: Tractor,
  ip: Lightbulb,
  other: MoreHorizontal,
};

const typeLabels = {
  stock: "Stock",
  land: "Land",
  company: "Company",
  livestock: "Livestock",
  ip: "IP",
  other: "Other",
};

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

export default function AcquisitionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const user = useQuery(api.users.me);
  const acquisitions = useQuery(
    api.acquisitions.list,
    user
      ? {
          status:
            statusFilter !== "all"
              ? (statusFilter as "proposed" | "approved" | "in_progress" | "acquired" | "rejected")
              : undefined,
        }
      : "skip"
  );

  const filteredAcquisitions = acquisitions?.filter((a) =>
    typeFilter === "all" ? true : a.type === typeFilter
  );

  // Group acquisitions by type
  const groupedAcquisitions = filteredAcquisitions?.reduce(
    (acc, acquisition) => {
      const type = acquisition.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(acquisition);
      return acc;
    },
    {} as Record<string, typeof filteredAcquisitions>
  );

  // Order of categories to display
  const categoryOrder = ["land", "livestock", "company", "stock", "ip", "other"] as const;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Target Acquisitions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assets we&apos;re targeting to acquire from Babylon
          </p>
        </div>
        <Link href="/acquisitions/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Propose
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[140px] text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="proposed">Proposed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="acquired">Acquired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-[140px] text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="stock">Stock</SelectItem>
            <SelectItem value="land">Land</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="livestock">Livestock</SelectItem>
            <SelectItem value="ip">IP</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Acquisitions List */}
      {filteredAcquisitions === undefined ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      ) : filteredAcquisitions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 py-12 text-center">
          <p className="text-sm text-muted-foreground">No acquisitions found.</p>
          <Link href="/acquisitions/new">
            <Button variant="outline" size="sm" className="mt-4">
              Propose the first one
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {categoryOrder.map((type) => {
            const items = groupedAcquisitions?.[type];
            if (!items || items.length === 0) return null;

            const TypeIcon = typeIcons[type];

            return (
              <div key={type}>
                {/* Category Header */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h2 className="text-sm font-medium text-foreground">
                    {typeLabels[type]}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    ({items.length})
                  </span>
                </div>

                {/* Category Items */}
                <div className="divide-y divide-border rounded-lg border border-border bg-card">
                  {items.map((acquisition) => {
                    const status = statusConfig[acquisition.status];

                    return (
                      <Link
                        key={acquisition._id}
                        href={`/acquisitions/${acquisition._id}`}
                        className="group flex items-center gap-4 px-4 py-2.5 transition-colors hover:bg-muted/50"
                      >
                        {/* Title */}
                        <div className="min-w-0 flex-1">
                          <span className="truncate text-sm font-medium text-foreground">
                            {acquisition.title}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="hidden w-28 items-center gap-2 sm:flex">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all ${status.progressColor}`}
                              style={{ width: `${status.progress}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {status.progress}%
                          </span>
                        </div>

                        {/* Status badge */}
                        <Badge
                          variant="outline"
                          className={`hidden shrink-0 text-[11px] font-medium sm:inline-flex ${status.badge}`}
                        >
                          {status.label}
                        </Badge>

                        {/* Cost */}
                        <div className="hidden w-24 shrink-0 text-right lg:block">
                          {acquisition.estimatedCost ? (
                            <span className="text-sm font-medium tabular-nums text-foreground">
                              ${(acquisition.estimatedCost / 100).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </div>

                        {/* Chevron */}
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
