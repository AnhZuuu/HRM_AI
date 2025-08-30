"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { ArrowLeft, Calendar as CalendarIcon, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export type SalaryTypeUI = "Net" | "Gross";
export type Option = { id: string; label?: string };

const schema = z.object({
  applicantId: z.string().min(1, "Applicant is required"),
  interviewOutcomeId: z.string().min(1, "Interview outcome is required"),
  proposedSalary: z.number().nonnegative("Salary must be >= 0"),
  salaryType: z.enum(["Net", "Gross"]),
  proposedStartDate: z.string().min(1, "Start date is required"), // yyyy-mm-dd
  notes: z.string().optional(),
});

export type CreateOnboardFormValues = z.infer<typeof schema>;

type Props = {
  defaultValues?: Partial<CreateOnboardFormValues>;
  applicantOptions: Option[];
  outcomeOptions: Option[];
  lockApplicantOutcome?: boolean;
  submitting?: boolean;
  onSubmit: (values: CreateOnboardFormValues) => void | Promise<void>;
  onReset?: () => void;
};

export default function CreateOnboardForm({
  defaultValues,
  applicantOptions,
  outcomeOptions,
  lockApplicantOutcome = false,
  submitting = false,
  onSubmit,
  onReset,
}: Props) {
  const router = useRouter();
  const form = useForm<CreateOnboardFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      applicantId: "",
      interviewOutcomeId: "",
      proposedSalary: 0,
      salaryType: "Net",
      proposedStartDate: "",
      notes: "",
      ...defaultValues,
    },
  });

  return (
    <div className="min-h-[90vh] w-full bg-muted/30 p-4 md:p-8">
       <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
      <Card className="mx-auto max-w-2xl rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Tạo onboard</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Applicant */}
            <div className="space-y-2">
              <Label>Ứng viên</Label>
              <Select
                value={form.watch("applicantId")}
                onValueChange={(v) => form.setValue("applicantId", v, { shouldValidate: true })}
                disabled={lockApplicantOutcome || submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select applicant" />
                </SelectTrigger>
                <SelectContent>
                  {applicantOptions.length === 0 ? (
                    <SelectItem value="none" disabled>
                      {lockApplicantOutcome ? "Prefilled from previous page" : "No applicants"}
                    </SelectItem>
                  ) : (
                    applicantOptions.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.label || a.id}
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

            {/* Interview outcome */}
            <div className="space-y-2">
              <Label>Interview Outcome</Label>
              <Select
                value={form.watch("interviewOutcomeId")}
                onValueChange={(v) => form.setValue("interviewOutcomeId", v, { shouldValidate: true })}
                disabled={lockApplicantOutcome || submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Please select" />
                </SelectTrigger>
                <SelectContent>
                  {outcomeOptions.length === 0 ? (
                    <SelectItem value="none" disabled>
                      {lockApplicantOutcome ? "Prefilled from previous page" : "No outcomes"}
                    </SelectItem>
                  ) : (
                    outcomeOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label || o.id}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.interviewOutcomeId && (
                <p className="text-sm text-destructive">{form.formState.errors.interviewOutcomeId.message}</p>
              )}
            </div>

            {/* Proposed salary with $ prefix */}
            <div className="space-y-2">
              <Label>Lương đề xuất</Label>
              <div className="relative">
               
                <Input
                  type="number"
                  inputMode="decimal"
                  className="pl-7"
                  value={form.watch("proposedSalary") ?? 0}
                  onChange={(e) => {
                    const n = e.currentTarget.valueAsNumber;
                    form.setValue("proposedSalary", Number.isNaN(n) ? 0 : n, { shouldValidate: true });
                  }}
                  placeholder="65000"
                />
              </div>
              {form.formState.errors.proposedSalary && (
                <p className="text-sm text-destructive">{form.formState.errors.proposedSalary.message}</p>
              )}
            </div>

            {/* Salary type + start date */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Loại lương</Label>
                <Select
                  value={form.watch("salaryType")}
                  onValueChange={(v: SalaryTypeUI) => form.setValue("salaryType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net">Net</SelectItem>
                    <SelectItem value="Gross">Gross</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ngày đi làm</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={form.watch("proposedStartDate") || ""}
                    onChange={(e) => form.setValue("proposedStartDate", e.target.value, { shouldValidate: true })}
                  />                  
                </div>
                {form.formState.errors.proposedStartDate && (
                  <p className="text-sm text-destructive">{form.formState.errors.proposedStartDate.message}</p>
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

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onReset?.();
                }}
                disabled={submitting}
              >
                Làm mới
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang tạo..." : "Tạo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
