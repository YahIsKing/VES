"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatNumberWithCommas, removeCommas } from "@/lib/utils/format";

type AcquisitionType = "stock" | "land" | "company" | "livestock" | "ip" | "other";

const typeLabels = {
  stock: "Stock",
  land: "Land",
  company: "Company",
  livestock: "Livestock",
  ip: "Intellectual Property",
  other: "Other",
};

function FormField({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {optional && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            (optional)
          </span>
        )}
      </Label>
      {children}
    </div>
  );
}

export default function NewAcquisitionPage() {
  const router = useRouter();
  const propose = useMutation(api.acquisitions.propose);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<AcquisitionType>("stock");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [unitsNeeded, setUnitsNeeded] = useState("");

  // Type-specific fields
  const [ticker, setTicker] = useState("");
  const [location, setLocation] = useState("");
  const [acreage, setAcreage] = useState("");
  const [quantity, setQuantity] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const metadata: {
        ticker?: string;
        location?: string;
        acreage?: number;
        quantity?: number;
        url?: string;
      } = {};

      if (ticker) metadata.ticker = ticker.toUpperCase();
      if (location) metadata.location = location;
      if (acreage) metadata.acreage = parseFloat(acreage);
      if (quantity) metadata.quantity = parseInt(quantity);
      if (url) metadata.url = url;

      await propose({
        title,
        description,
        type,
        metadata,
        estimatedCost: estimatedCost ? Math.round(parseFloat(estimatedCost) * 100) : undefined,
        unitsNeeded: unitsNeeded ? parseInt(unitsNeeded) : undefined,
      });

      toast.success("Acquisition proposed successfully!");
      router.push("/acquisitions");
    } catch (error) {
      toast.error("Failed to propose acquisition");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/acquisitions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to acquisitions
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          Propose Acquisition
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Propose a new target for the community to acquire
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <section className="space-y-6">
          <div>
            <h2 className="text-sm font-medium text-foreground">Basic Information</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              The core details about this acquisition target
            </p>
          </div>

          <div className="grid gap-6 rounded-lg border border-border bg-card p-4">
            <FormField label="Type" htmlFor="type">
              <Select
                value={type}
                onValueChange={(v) => setType(v as AcquisitionType)}
              >
                <SelectTrigger id="type" className="h-10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Title" htmlFor="title">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Microsoft Corporation Stock"
                className="h-10"
                required
              />
            </FormField>

            <FormField label="Description" htmlFor="description">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why should the community acquire this? What value does it bring?"
                rows={3}
                className="resize-none"
                required
              />
            </FormField>
          </div>
        </section>

        {/* Type-specific Details */}
        {(type === "stock" || type === "land" || type === "company" || type === "livestock" || type === "ip") && (
          <section className="space-y-6">
            <div>
              <h2 className="text-sm font-medium text-foreground">
                {typeLabels[type]} Details
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Additional information specific to this type
              </p>
            </div>

            <div className="grid gap-6 rounded-lg border border-border bg-card p-4">
              {type === "stock" && (
                <FormField label="Stock Ticker" htmlFor="ticker" optional>
                  <Input
                    id="ticker"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    placeholder="e.g., MSFT"
                    className="h-10 uppercase"
                  />
                </FormField>
              )}

              {type === "land" && (
                <>
                  <FormField label="Location" htmlFor="location" optional>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Alaska, USA"
                      className="h-10"
                    />
                  </FormField>
                  <FormField label="Acreage" htmlFor="acreage" optional>
                    <Input
                      id="acreage"
                      type="text"
                      inputMode="decimal"
                      value={formatNumberWithCommas(acreage)}
                      onChange={(e) => setAcreage(removeCommas(e.target.value))}
                      placeholder="e.g., 100"
                      className="h-10"
                    />
                  </FormField>
                </>
              )}

              {type === "company" && (
                <>
                  <FormField label="Headquarters Location" htmlFor="location" optional>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., San Francisco, CA"
                      className="h-10"
                    />
                  </FormField>
                  <FormField label="Website URL" htmlFor="url" optional>
                    <Input
                      id="url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="h-10"
                    />
                  </FormField>
                </>
              )}

              {type === "livestock" && (
                <FormField label="Quantity" htmlFor="quantity" optional>
                  <Input
                    id="quantity"
                    type="text"
                    inputMode="numeric"
                    value={formatNumberWithCommas(quantity)}
                    onChange={(e) => setQuantity(removeCommas(e.target.value))}
                    placeholder="e.g., 100"
                    className="h-10"
                  />
                </FormField>
              )}

              {type === "ip" && (
                <FormField label="Reference URL" htmlFor="url" optional>
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="h-10"
                  />
                </FormField>
              )}
            </div>
          </section>
        )}

        {/* Financial Information */}
        <section className="space-y-6">
          <div>
            <h2 className="text-sm font-medium text-foreground">Financial Information</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Cost estimates and unit quantities
            </p>
          </div>

          <div className="grid gap-6 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
            <FormField label="Estimated Cost ($)" htmlFor="estimatedCost" optional>
              <Input
                id="estimatedCost"
                type="text"
                inputMode="decimal"
                value={formatNumberWithCommas(estimatedCost)}
                onChange={(e) => setEstimatedCost(removeCommas(e.target.value))}
                placeholder="e.g., 1,000,000"
                className="h-10"
              />
            </FormField>

            <FormField label="Units Needed" htmlFor="unitsNeeded" optional>
              <Input
                id="unitsNeeded"
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(unitsNeeded)}
                onChange={(e) => setUnitsNeeded(removeCommas(e.target.value))}
                placeholder="e.g., 100,000"
                className="h-10"
              />
            </FormField>
          </div>
        </section>

        {/* External Link (for types that don't have URL in their specific section) */}
        {type !== "company" && type !== "ip" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-sm font-medium text-foreground">External Reference</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Link to more information about this target
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <FormField label="External Link" htmlFor="url" optional>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="h-10"
                />
              </FormField>
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <Link href="/acquisitions">
            <Button variant="outline" type="button" size="sm">
              Cancel
            </Button>
          </Link>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Proposing..." : "Propose Acquisition"}
          </Button>
        </div>
      </form>
    </div>
  );
}
