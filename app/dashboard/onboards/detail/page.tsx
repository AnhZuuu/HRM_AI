"use client";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Paperclip,
  FileText,
  Check,
  X,
  Lock,
  User,
  PencilLine,
  Users,
  MapPin,
} from "lucide-react";

function fmtDateTime(iso?: string, mode: "date" | "datetime" = "date") {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}`;
  if (mode === "date") return date;
  return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------------------------------------------
// Types
// ---------------------------------------------
export type SalaryType = "Hourly" | "Monthly" | "Yearly";
export type OnboardRequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Draft";

export interface RequestOnboardHistoryModel {
  id: string;
  step: number;
  title: string;
  note?: string | null;
  date: string; // ISO string
}

export interface ApplicantSummary {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  summary?: string | null;
}

export interface InterviewSchedule {
  id?: string;
  stageOrder?: number;
  stageName?: string;
  startTime?: string; // ISO
  endTime?: string; // ISO
  interviewerNames?: string[];
  location?: string | null;
}

export interface InterviewOutcome {
  id: string;
  interviewScheduleId: string;
  interviewSchedule: InterviewSchedule | null;
  createdBy: string | null;
  feedback: string;
}

export interface RequestOnboardModelUi {
  id: string;
  interviewOutcomeId?: string | null;
  applicant: ApplicantSummary;
  proposedSalary?: number | null;
  salaryType?: SalaryType | null;
  proposedStartDate?: string | null; // yyyy-mm-dd
  status: OnboardRequestStatus;
  histories: RequestOnboardHistoryModel[];
  interviewOutcomes: InterviewOutcome[];
}

// ---------------------------------------------
// Demo data (remove when wiring to API)
// ---------------------------------------------
const demo: RequestOnboardModelUi = {
  id: "req-001",
  applicant: {
    id: "cand-01",
    fullName: "John Doe",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=JD",
    summary: "Candidate for Frontend Engineer",
  },
  proposedSalary: 65000,
  salaryType: "Yearly",
  proposedStartDate: "2025-09-01",
  interviewOutcomeId: "pass-strong",
  status: "Pending",
  histories: [
    {
      id: "h1",
      step: 1,
      title: "Created",
      note: "Initial request created.",
      date: "2025-08-01",
    },
    {
      id: "h2",
      step: 2,
      title: "Reviewed",
      note: "HR reviewed details.",
      date: "2025-08-05",
    },
  ],
  interviewOutcomes: [
    {
      id: "o1",
      interviewScheduleId: "s1",
      createdBy: "hr.lead@company.com",
      feedback: "Strong fundamentals, good culture fit. Recommend proceed.",
      interviewSchedule: {
        id: "s1",
        stageOrder: 1,
        stageName: "Screening",
        startTime: "2025-07-30T09:00:00",
        interviewerNames: ["Alice"],
        location: "Google Meet",
      },
    },
    {
      id: "o2",
      interviewScheduleId: "s2",
      createdBy: "frontend.lead@company.com",
      feedback: "Solved tasks with minor hints. Good JS knowledge.",
      interviewSchedule: {
        id: "s2",
        stageOrder: 2,
        stageName: "Technical",
        startTime: "2025-08-02T14:00:00",
        interviewerNames: ["Bob", "Carol"],
        location: "Office A",
      },
    },
    {
      id: "o3",
      interviewScheduleId: "s3",
      createdBy: "cto@company.com",
      feedback: "Alignment on roadmap and expectations.",
      interviewSchedule: {
        id: "s3",
        stageOrder: 3,
        stageName: "Final",
        startTime: "2025-08-05T16:30:00",
        interviewerNames: ["Dana"],
        location: "Office B",
      },
    },
  ],
};

export default function OnboardRequestDetailPage() {
  const [model, setModel] = useState<RequestOnboardModelUi>(demo);
  const [notes, setNotes] = useState("");
  const disableActions =
    model.status === "Approved" || model.status === "Rejected";

  return (
    <div className="min-h-[90vh] w-full bg-muted/30 p-4 md:p-8">
      {/* OUTER CARD (single panel like sample) */}
      <Card className="mx-auto max-w-6xl rounded-2xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr_320px]">
          {/* LEFT SIDEBAR */}
          <div className="border-b md:border-b-0 md:border-r p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative h-24 w-24 rounded-full bg-gradient-to-b from-blue-100 to-blue-200 overflow-hidden">
                <img
                  src={
                    model.applicant.avatarUrl ||
                    "https://api.dicebear.com/7.x/initials/svg?seed=NA"
                  }
                  alt={model.applicant.fullName}
                  className="h-full w-full rounded-full object-cover mix-blend-multiply"
                />
              </div>
              <h3 className="mt-4 text-lg font-semibold leading-tight">
                {model.applicant.fullName}
              </h3>
              <p className="mt-1 max-w-[220px] text-sm leading-relaxed text-muted-foreground">
                {model.applicant.summary ||
                  "Lorem ipsum dolori at amet, consectetur"}
              </p>
            </div>

            <div className="my-6 h-px bg-border" />

            <button className="flex w-full items-center gap-2 text-left text-sm text-primary underline-offset-4 hover:underline">
              <FileText className="h-4 w-4" /> View interview outcome
            </button>

            <div className="my-6 h-px bg-border" />

            <div className="text-sm font-medium text-foreground/80">
              Attachments
            </div>
          </div>

          <div className="p-4 md:p-6">
            <div className="mb-4 text-lg font-semibold">
              Onboarding Request / Request
            </div>

            {/* Tabs with underline style */}
            <Tabs defaultValue="details" className="w-full">
              <div className="border-b">
                <TabsList className="h-auto gap-6 bg-transparent p-0">
                  <TabsTrigger
                    value="details"
                    className="rounded-none bg-transparent px-0 pb-3 text-sm font-medium data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="rounded-none bg-transparent px-0 pb-3 text-sm font-medium data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                  >
                    History
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* DETAILS TAB */}
              <TabsContent value="details" className="mt-6 space-y-5">
                {/* Interview outcome */}
                <div className="space-y-2">
                  <Label>Interview Outcome</Label>
                  <Select
                    value={model.interviewOutcomeId || ""}
                    onValueChange={(v) =>
                      setModel((m) => ({
                        ...m,
                        interviewOutcomeId: v || undefined,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Please select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="pass-strong">Pass – strong</SelectItem>
                      <SelectItem value="pass">Pass</SelectItem>
                      <SelectItem value="hold">Hold</SelectItem>
                      <SelectItem value="reject">Reject</SelectItem>
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
                      value={model.proposedSalary ?? ""}
                      onChange={(e) =>
                        setModel((m) => ({
                          ...m,
                          proposedSalary: Number(e.target.value || 0),
                        }))
                      }
                      placeholder="65,000"
                    />
                  </div>
                </div>

                {/* Salary type + start date with icons */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Salary Type</Label>
                    <Select
                      value={model.salaryType || undefined}
                      onValueChange={(v: SalaryType) =>
                        setModel((m) => ({ ...m, salaryType: v }))
                      }
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
                        value={model.proposedStartDate || ""}
                        onChange={(e) =>
                          setModel((m) => ({
                            ...m,
                            proposedStartDate: e.target.value,
                          }))
                        }
                      />
                      <CalendarIcon className="pointer-events-none absolute right-9 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-2">
                  <Label>Comments</Label>
                  <Textarea
                    placeholder="Type your comment here"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </TabsContent>

              {/* HISTORY TAB (center) */}
              <TabsContent value="history" className="mt-6 space-y-3">
                {model.histories.map((h) => (
                  <div key={h.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        Step {h.step}: {h.title}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {h.date}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {h.note}
                    </p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>

            {/* ACTIONS */}
            <CardFooter className="mt-6 flex flex-wrap gap-3 px-0">
              <Button disabled={disableActions} className="gap-2">
                <Check className="h-4 w-4" />
                Xác nhận và gửi mail
              </Button>
              <Button
                variant="destructive"
                disabled={disableActions}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
            </CardFooter>
          </div>
          {/* RIGHT SIDEBAR – Interview Outcomes */}
          <div className="border-t md:border-t-0 md:border-l p-4 md:p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base">
                Interview Outcome Histories
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {model.interviewOutcomes?.length ? (
                <ol className="relative border-s pl-6">
                  {model.interviewOutcomes.map((o, idx) => (
                    <li key={o.id} className="mb-8 ms-4">
                      <span className="absolute -start-2 grid h-4 w-4 place-items-center rounded-full border bg-blue-50 border-blue-200">
                        <span className="h-2 w-2 rounded-[4px] bg-blue-500" />
                      </span>

                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {`Stage ${
                            o.interviewSchedule?.stageOrder ?? idx + 1
                          }`}
                          {o.interviewSchedule?.stageName
                            ? ` · ${o.interviewSchedule.stageName}`
                            : ""}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {fmtDateTime(o.interviewSchedule?.startTime)}
                        </span>
                      </div>
                      <div className="mt-2 space-y-2 text-sm text-muted-foreground bg-gray-100 border-b rounded-2xl shadow-sm p-2">
                        {o.interviewSchedule?.interviewerNames?.length ? (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {o.interviewSchedule.interviewerNames.join(", ")}
                          </div>
                        ) : null}
                        {o.interviewSchedule?.location ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />{" "}
                            {o.interviewSchedule.location}
                          </div>
                        ) : null}
                        <div className="flex items-center gap-2">
                          <PencilLine className="h-4 w-4" />
                          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                            {o.feedback}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No outcomes yet.
                </div>
              )}
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
}
