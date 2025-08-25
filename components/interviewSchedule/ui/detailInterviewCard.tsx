"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  FileText,
  MapPin,
  PencilLine,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/app/utils/helper";
import {
  ApiInterviewSchedule,
  fmt,
  UiInterviewOutcome,
} from "../useInterviewScheduleDetail";
import { INTERVIEW_STATUS_MAP } from "@/app/utils/enum";
import { FancyTextarea } from "./fancyTextarea";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";

type Props = {
  schedule: ApiInterviewSchedule | null;
  outcomes: UiInterviewOutcome[];
  durationMin: number;
  feedback: string;
  lastSubmitted: UiInterviewOutcome | null;

  loading: boolean;
  loadErr: string | null;
  submitting: boolean;
  submitErr: string | null;
  composerOpen: boolean;

  setFeedback: Dispatch<SetStateAction<string>>;
  setComposerOpen: (b: boolean) => void;
  submitFeedback: () => Promise<void> | void;
};

type ApiOutcomeItem = {
  interviewScheduleId: string;
  feedback: string | null;
  id: string;
  creationDate: string | null;
};

export default function InterviewScheduleDetailView({
  schedule,
  outcomes,
  durationMin,
  feedback,
  lastSubmitted,
  loading,
  loadErr,
  submitting,
  submitErr,
  composerOpen,
  setFeedback,
  setComposerOpen,
  submitFeedback,
}: Props) {
  const router = useRouter();
  const [existingOutcome, setExistingOutcome] =
    useState<UiInterviewOutcome | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [existingErr, setExistingErr] = useState<string | null>(null);
  const outcomeToShow = lastSubmitted ?? existingOutcome;

  useEffect(() => {
    if (!schedule?.id) return;
    if (lastSubmitted) return; // vừa submit thì ưu tiên cái vừa gửi

    let alive = true;
    (async () => {
      setLoadingExisting(true);
      setExistingErr(null);
      try {
        const res = await authFetch(`${API.INTERVIEW.OUTCOME}`, {
          method: "GET",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const list: ApiOutcomeItem[] = Array.isArray(json?.data?.data)
          ? json.data.data
          : Array.isArray(json?.data)
          ? json.data
          : [];

        const m = list.find((o) => o.interviewScheduleId === schedule.id);
        if (alive && m) {
          setExistingOutcome({
            id: m.id,
            feedback: m.feedback ?? "",
            createdAt: m.creationDate ?? "",
            interviewSchedule: {
              id: schedule.id,
              stageOrder: schedule.interviewStageModel?.order ?? null,
              stageName: schedule.interviewStageModel?.stageName ?? null,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              location: schedule.departmentModel?.departmentName ?? null,
              interviewerNames:
                schedule.interviewerModels?.map((i) => i.name) ?? [],
            },
            interviewOutcomeStatus: 1,
          });
          setComposerOpen(false); // có outcome thì ẩn form
        }
      } catch (e: any) {
        if (alive)
          setExistingErr(e?.message || "Không tải được đánh giá hiện có.");
      } finally {
        if (alive) setLoadingExisting(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [schedule?.id, lastSubmitted]);

  return (
    <div className="min-h-[90vh] w-full bg-muted/30 p-4 md:p-8">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </Button>
      <Card className="mx-auto max-w-6xl rounded-2xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr_320px]">
          {/* LEFT — Applicant */}
          <div className="border-b md:border-b-0 md:border-r p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 text-lg font-semibold">
                Thông tin ứng viên
              </div>
              <div className="relative h-24 w-24 rounded-full bg-gradient-to-b from-blue-100 to-blue-200 overflow-hidden">
                <Avatar className="h-24 w-24 rounded-2xl ring-1 ring-border">
                  <AvatarFallback className="text-2xl font-semibold">
                    {initials(schedule?.cvApplicantModel.fullName)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <h3 className="mt-4 text-lg font-semibold leading-tight">
                {schedule?.cvApplicantModel.fullName ?? "—"}
              </h3>

              <p className="mt-1 max-w-[220px] text-sm leading-relaxed text-muted-foreground">
                Ứng tuyển vào vị trí{" "}
                {schedule?.campaignPositionModel?.description}
              </p>
            </div>

            <div className="my-6 h-px bg-border" />

            <div className="space-y-2 text-sm mb-2">
              <div className="text-muted-foreground">Email</div>
              <div className="font-medium">
                {schedule?.cvApplicantModel.email || "—"}
              </div>
            </div>

            <a
              className="flex w-full items-center gap-2 text-left text-sm text-primary underline-offset-4 hover:underline"
              href={schedule?.cvApplicantModel.fileUrl}
            >
              <FileText className="h-4 w-4" /> CV đính kèm
            </a>

            <div className="my-6 h-px bg-border" />
          </div>

          {/* CENTER */}
          <div className="p-4 md:p-6">
            <div className="mb-4 text-lg font-semibold">
              Thông tin cuộc phỏng vấn
            </div>

            {loading ? (
              <div className="text-sm text-muted-foreground">
                Đang tải dữ liệu…
              </div>
            ) : loadErr ? (
              <div className="text-sm text-rose-600">{loadErr}</div>
            ) : (
              <Tabs defaultValue="overview" className="w-full">
                <div className="border-b">
                  <TabsList className="h-auto gap-6 bg-transparent p-0">
                    <TabsTrigger
                      value="overview"
                      className="rounded-none bg-transparent px-0 pb-3 text-sm font-medium data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                    >
                      Cơ bản
                    </TabsTrigger>
                    <TabsTrigger
                      value="panel"
                      className="rounded-none bg-transparent px-0 pb-3 text-sm font-medium data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                    >
                      Chi tiết
                    </TabsTrigger>
                    <TabsTrigger
                      value="feedback"
                      className="rounded-none bg-transparent px-0 pb-3 text-sm font-medium data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                    >
                      Đánh giá
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* OVERVIEW */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                  <SectionCard title="Basic Information">
                    <InfoRow label="Interview Type" value={"—"} />
                    <InfoRow
                      label="Round"
                      value={schedule?.interviewStageModel?.order}
                    />
                    <InfoRow
                      label="Status"
                      value={
                        <Badge
                          className={
                            INTERVIEW_STATUS_MAP[schedule?.status ?? 0]
                              .className
                          }
                        >
                          {INTERVIEW_STATUS_MAP[schedule?.status ?? 0].label}
                        </Badge>
                      }
                    />
                    <InfoRow
                      label="Duration"
                      value={`${durationMin} minutes`}
                    />
                  </SectionCard>

                  <SectionCard title="Schedule Timing">
                    <InfoRow
                      label="Start"
                      value={
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {fmt(schedule?.startTime)}
                        </span>
                      }
                    />
                    <InfoRow
                      label="End"
                      value={
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {fmt(schedule?.endTime)}
                        </span>
                      }
                    />
                  </SectionCard>
                </TabsContent>

                {/* PANEL */}
                <TabsContent value="panel" className="mt-6 space-y-4">
                  <SectionCard title="Department & Position">
                    <InfoRow
                      label="Department"
                      value={schedule?.departmentModel?.departmentName || "—"}
                    />
                    <InfoRow
                      label="Position"
                      value={
                        schedule?.campaignPositionModel?.description ?? "—"
                      }
                    />
                  </SectionCard>

                  <SectionCard title="Interview Panel">
                    {schedule?.interviewerModels?.length ? (
                      schedule.interviewerModels.map((i) => (
                        <InfoRow
                          key={i.id}
                          label={
                            <span className="inline-flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />{" "}
                              Interv.
                            </span>
                          }
                          value={i.name}
                        />
                      ))
                    ) : (
                      <InfoRow
                        label="Interv."
                        value="No interviewers assigned."
                      />
                    )}
                  </SectionCard>

                  <SectionCard title="Notes">
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {schedule?.notes || "No notes provided."}
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Tạo vào: {fmt(schedule?.creationDate)}
                    </div>
                  </SectionCard>
                </TabsContent>

                {/* FEEDBACK */}
                <TabsContent value="feedback" className="mt-6">
                  <Card className="rounded-xl border bg-card shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">
                        {outcomeToShow ? "Đánh giá đã có" : "Đánh giá ứng viên"}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {outcomeToShow ? (
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            Gửi lúc:{" "}
                            {fmt(outcomeToShow?.createdAt ?? undefined)}
                          </div>
                          <div className="rounded-xl border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                            {outcomeToShow?.feedback || "—"}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              type="button"
                              onClick={() => {
                                setComposerOpen(true);
                                setFeedback("");
                              }}
                            >
                              Viết đánh giá khác
                            </Button>

                            <Button
                              type="button"
                              disabled={
                                !outcomeToShow?.id ||
                                !schedule?.cvApplicantModel?.id
                              }
                              onClick={() => {
                                const outcomeId = outcomeToShow!.id;
                                const applicantId =
                                  schedule!.cvApplicantModel!.fullName;
                                router.push(
                                  `/dashboard/onboards/new?outcomeId=${outcomeId}&applicantId=${applicantId}`
                                );
                              }}
                            >
                              Tạo onboard
                            </Button>
                          </div>
                        </div>
                      ) : loadingExisting ? (
                        <div className="text-sm text-muted-foreground">
                          Đang kiểm tra đánh giá hiện có…
                        </div>
                      ) : (
                        <>
                          {existingErr ? (
                            <div className="text-sm text-amber-600">
                              {existingErr}
                            </div>
                          ) : null}

                          <FancyTextarea
                            value={feedback}
                            onChange={setFeedback}
                            placeholder="Viết đánh giá về cuộc phỏng vấn..."
                            maxLength={1000}
                          />
                          <div className="flex items-center justify-between gap-3">
                            {submitErr ? (
                              <div className="text-sm text-rose-600">
                                {submitErr}
                              </div>
                            ) : (
                              <span />
                            )}
                            <div className="flex items-center gap-3">
                              <Button
                                variant="secondary"
                                onClick={() => setFeedback("")}
                                type="button"
                              >
                                Làm mới
                              </Button>
                              <Button
                                onClick={submitFeedback}
                                type="button"
                                disabled={submitting || !feedback.trim()}
                                className="gap-2"
                              >
                                {submitting ? "Đang gửi…" : "Nộp đánh giá"}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* RIGHT — timeline */}
          <RightTimeline outcomes={outcomes} />
        </div>
      </Card>
    </div>
  );
}

/* ===== Mini components ===== */
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 py-2 md:grid md:grid-cols-[180px_1fr] md:gap-4 md:py-2 border-b last:border-b-0">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:pt-1">
        {label}
      </div>
      <div className="text-sm leading-6">{value ?? "—"}</div>
    </div>
  );
}

function RightTimeline({ outcomes }: { outcomes: UiInterviewOutcome[] }) {
  return (
    <div className="border-t md:border-t-0 md:border-l p-4 md:p-6">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-base">Các vòng phỏng vấn</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {outcomes.length ? (
          <ol className="relative border-s pl-6">
            {outcomes.map((o, idx) => (
              <li key={o.id} className="mb-8 ms-4">
                <span className="absolute -start-2 grid h-4 w-4 place-items-center rounded-full border bg-blue-50 border-blue-200">
                  <span className="h-2 w-2 rounded-[4px] bg-blue-500" />
                </span>

                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {`Stage ${o.interviewSchedule?.stageOrder ?? idx + 1}`}
                    {o.interviewSchedule?.stageName
                      ? ` · ${o.interviewSchedule.stageName}`
                      : ""}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {fmt(o.interviewSchedule?.startTime ?? undefined)}
                  </span>
                </div>

                <div className="mt-2 space-y-2 text-sm text-muted-foreground bg-gray-100 border-b rounded-2xl shadow-sm p-2">
                  {o.interviewSchedule?.interviewerNames?.length ? (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {o.interviewSchedule?.interviewerNames?.join(", ")}
                    </div>
                  ) : null}

                  {o.interviewSchedule?.location ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {o.interviewSchedule.location}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <PencilLine className="h-4 w-4" />
                    <p className="mt-1 whitespace-pre-wrap">
                      {o.feedback || "—"}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="text-sm text-muted-foreground">Chưa phỏng vấn.</div>
        )}
      </CardContent>
    </div>
  );
}
