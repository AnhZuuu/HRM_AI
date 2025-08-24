"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Lock, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";

// Optional: if you already have these types in your project, import them instead
export type SalaryType = "Hourly" | "Monthly" | "Yearly";
export interface ApplicantSummary { id: string; fullName: string; email?: string | null }
export interface InterviewOutcome { id: string; name: string }
export interface RequestOnboardModelUi {
  id: string;
  interviewOutcomeId?: string | null;
  applicant: ApplicantSummary;
  proposedSalary?: number | null;
  salaryType?: SalaryType | null;
  proposedStartDate?: string | null; // yyyy-mm-dd
  status: any; // OnboardRequestStatus (import your own)
  histories: any[];
  interviewOutcomes: InterviewOutcome[];
}

const schema = z.object({
  applicantId: z.string({ required_error: "Please choose an applicant" }).min(1, "Please choose an applicant"),
  interviewOutcomeId: z.string().optional().nullable(),
  proposedSalary: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === "") return undefined;
      const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.-]/g, ""));
      return Number.isFinite(n) && n > 0 ? Math.trunc(n) : undefined;
    }),
  salaryType: z.enum(["Hourly", "Monthly", "Yearly"]).optional(),
  proposedStartDate: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Invalid date format (yyyy-mm-dd)"),
  notes: z.string().max(1000, "Max 1000 characters").optional(),
});

export type OnboardCreateForm = z.infer<typeof schema>;

export interface OnboardCreateDialogProps {
  applicants: ApplicantSummary[];
  interviewOutcomes: InterviewOutcome[];
  endpoint?: string; // POST endpoint. Example: `${API.ONBOARD.REQUESTS}`
  trigger?: React.ReactNode; // Optional custom trigger
  onCreated?: (created: RequestOnboardModelUi) => void;
  // If you use a custom fetcher (e.g., authFetch), pass it in:
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>;
}

export default function OnboardCreateDialog({
  applicants,
  interviewOutcomes,
  endpoint = "/api/onboards",
  trigger,
  onCreated,
  fetcher,
}: OnboardCreateDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const applicantOptions = useMemo(() => applicants ?? [], [applicants]);
  const outcomeOptions = useMemo(() => interviewOutcomes ?? [], [interviewOutcomes]);

  const form = useForm<OnboardCreateForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      applicantId: "",
      interviewOutcomeId: null,
      proposedSalary: undefined,
      salaryType: undefined,
      proposedStartDate: "",
      notes: "",
    },
    mode: "onChange",
  });

  const submitting = form.formState.isSubmitting;

  async function onSubmit(values: OnboardCreateForm) {
    // Build request payload as your API expects
    const payload = {
      applicantId: values.applicantId,
      interviewOutcomeId: values.interviewOutcomeId || null,
      proposedSalary: values.proposedSalary ?? null,
      salaryType: values.salaryType ?? null,
      proposedStartDate: values.proposedStartDate || null,
      notes: values.notes?.trim() || null,
    };

    try {
      const doFetch = fetcher ?? fetch;
      const res = await doFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "Failed to create onboard request");
      }

      const created: RequestOnboardModelUi = json?.data ?? json;
      toast({ title: "Onboard created", description: `Request for applicant successfully created.` });

      form.reset();
      setOpen(false);
      onCreated?.(created);
    } catch (e: any) {
      toast({
        title: "Create failed",
        description: e?.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> New Onboard
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Onboard</DialogTitle>
          <DialogDescription>Fill in the details below to create a new onboard request.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Applicant */}
          <div className="space-y-2">
            <Label>Applicant</Label>
            <Select
              value={form.watch("applicantId")}
              onValueChange={(v) => form.setValue("applicantId", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select applicant" />
              </SelectTrigger>
              <SelectContent>
                {applicantOptions.length === 0 ? (
                  <SelectItem value="" disabled>
                    No applicants
                  </SelectItem>
                ) : (
                  applicantOptions.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.fullName || a.email || a.id}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.applicantId && (
              <p className="text-sm text-destructive">{form.formState.errors.applicantId.message}</p>
            )}
          </div>

          <Separator />

          {/* Your provided UI (Details tab content) */}
          <div className="mt-2 space-y-5">
            {/* Interview outcome */}
            <div className="space-y-2">
              <Label>Interview Outcome</Label>
              <Select
                value={form.watch("interviewOutcomeId") ?? ""}
                onValueChange={(v) => form.setValue("interviewOutcomeId", v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Please select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {outcomeOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Proposed salary with $ prefix */}
            <div className="space-y-2">
              <Label>Proposed Salary</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  inputMode="numeric"
                  className="pl-7"
                  value={String(form.watch("proposedSalary") ?? "")}
                  onChange={(e) => form.setValue("proposedSalary", e.target.value as any)}
                  placeholder="65,000"
                />
              </div>
              {form.formState.errors.proposedSalary && (
                <p className="text-sm text-destructive">{form.formState.errors.proposedSalary.message as any}</p>
              )}
            </div>

            {/* Salary type + start date with icons */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Salary Type</Label>
                <Select
                  value={form.watch("salaryType") as any}
                  onValueChange={(v: SalaryType) => form.setValue("salaryType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hourly">Hourly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Proposed Start Date</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={form.watch("proposedStartDate") || ""}
                    onChange={(e) => form.setValue("proposedStartDate", e.target.value)}
                  />
                  <CalendarIcon className="pointer-events-none absolute right-9 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                {form.formState.errors.proposedStartDate && (
                  <p className="text-sm text-destructive">{form.formState.errors.proposedStartDate.message as any}</p>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label>Comments</Label>
              <Textarea
                placeholder="Type your comment here"
                value={form.watch("notes") || ""}
                onChange={(e) => form.setValue("notes", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => form.reset()} disabled={submitting}>
              Reset
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
