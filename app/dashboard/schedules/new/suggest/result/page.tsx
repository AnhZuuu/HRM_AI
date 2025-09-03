"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter as DialogFooterUI,
} from "@/components/ui/dialog";
import { Calendar, Clock, Mail, Phone, Users } from "lucide-react";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";
import { toast, ToastContainer } from "react-toastify";

/* ================= Types ================= */
type Interviewer = { id: string; name: string };

type SuggestedSchedule = {
  date: string; // "YYYY-MM-DD"
  timeSlot: string; // "08:00 - 09:00"
  nextInterviewStageName: string;
  nextInterviewStageId: string;
  currentInterviewStageName: string;
  interviewers: Interviewer[];
};

type CandidatePlan = {
  candidateId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  totalInterviewDurationMinutes: number;
  suggestedSchedules: SuggestedSchedule[];
};

type InterviewPlanResponse = {
  positionId: string;
  interviewPlan: {
    totalCandidates: number;
    candidates: CandidatePlan[];
  };
};

/* ================= Props ================= */
export type SuggestSchedulesProps = {
  positionId: string;
  dateTimes?: string[];
};

/* ================= Envelope helper (data may be a JSON string) ================= */
type MaybeStringified<T> = T | string;
type ApiEnvelope<T> = {
  code: number;
  status: boolean;
  message?: string;
  data: MaybeStringified<T>;
};
function parseMaybeStringJSON<T>(v: MaybeStringified<T>): T {
  return typeof v === "string" ? (JSON.parse(v) as T) : (v as T);
}

/* ================= Time helpers ================= */
function parseTimeSlot(slot: string): { startHM: string; endHM: string } {
  // "08:00 - 08:15" → { "08:00", "08:15" }
  const [a, b] = slot.split("-").map((s) => s.trim());
  return { startHM: a, endHM: b };
}
function addHours(d: Date, hours: number) {
  const nd = new Date(d.getTime());
  nd.setHours(nd.getHours() + hours);
  return nd;
}
function toISOWithPlus7(dateYMD: string, hm: string): string {
  // Interprets chosen time as local time, adds +7 hours, returns ISO with Z
  const [y, m, d] = dateYMD.split("-").map(Number);
  const [hh, mm] = hm.split(":").map(Number);
  const local = new Date(y, m - 1, d, hh, mm, 0, 0);
  return addHours(local, 7).toISOString();
}

/* ================= Component ================= */
export default function SuggestSchedulesPage(props: SuggestSchedulesProps) {
  const { positionId, dateTimes } = props;

  const [data, setData] = useState<InterviewPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // selected schedule per candidate
  const [selectedMap, setSelectedMap] = useState<Record<string, number>>({});

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogCandidate, setDialogCandidate] = useState<CandidatePlan | null>(null);
  const [dialogSchedule, setDialogSchedule] = useState<SuggestedSchedule | null>(null);
  const [startHM, setStartHM] = useState("08:00");
  const [endHM, setEndHM] = useState("09:00");
  const [posting, setPosting] = useState(false);

  // Always work with a safe array
  const safeDateTimes = useMemo<string[]>(
    () => (Array.isArray(dateTimes) ? dateTimes.map(String) : []),
    [dateTimes]
  );

  // Build query string
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (positionId) params.set("positionId", positionId);
    safeDateTimes.filter(Boolean).forEach((dt) => params.append("dateTimes", dt));
    return params.toString();
  }, [positionId, safeDateTimes]);

  // Build GET endpoint safely
  const endpointBase = useMemo(() => {
    const base = (API as any)?.CV?.BASE ?? (API as any)?.CV ?? "";
    return String(base);
  }, []);
  const suggestEndpoint = useMemo(
    () => `${endpointBase.replace(/\/+$/, "")}/suggest-schedules`,
    [endpointBase]
  );
  const apiUrl = useMemo(() => `${suggestEndpoint}?${queryString}`, [suggestEndpoint, queryString]);

  // Schedule POST endpoint
  const scheduleEndpoint = useMemo(() => {
    const val = (API as any)?.INTERVIEW?.SCHEDULE ?? (API as any)?.INTERVIEW ?? "/api/interview/schedule";
    return String(val);
  }, []);

  // Fetch suggestions
  useEffect(() => {
    const controller = new AbortController();
    if (!positionId || safeDateTimes.length === 0) {
      setData(null);
      setErrorMsg(null);
      setLoading(false);
      return () => controller.abort();
    }

    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await authFetch(apiUrl, { method: "GET", signal: controller.signal as AbortSignal });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Request failed with status ${res.status}`);
        }
        const envelope = (await res.json()) as ApiEnvelope<InterviewPlanResponse>;
        const payload = parseMaybeStringJSON<InterviewPlanResponse>(envelope.data);
        setData(payload);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setErrorMsg(err?.message ?? "Unknown error");
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [positionId, safeDateTimes, apiUrl]);

  // Initialize per-candidate selection
  useEffect(() => {
    if (!data) return;
    const next: Record<string, number> = {};
    for (const c of data.interviewPlan.candidates) {
      if (c.suggestedSchedules.length > 0) next[c.candidateId] = 0;
    }
    setSelectedMap(next);
  }, [data]);

  function handlePickSchedule(candidateId: string, index: number) {
    setSelectedMap((prev) => ({ ...prev, [candidateId]: index }));
  }

  // Open dialog with selected schedule prefilled
  function openDialog(c: CandidatePlan) {
    const idx = selectedMap[c.candidateId];
    const s = c.suggestedSchedules[idx];
    if (!s) return;
    const { startHM: dStart, endHM: dEnd } = parseTimeSlot(s.timeSlot);
    setDialogCandidate(c);
    setDialogSchedule(s);
    setStartHM(dStart);
    setEndHM(dEnd);
    setDialogOpen(true);
  }

  // POST create schedule with +7h applied
  async function confirmCreate() {
    if (!dialogCandidate || !dialogSchedule) return;
    setPosting(true);
    try {
      const startTime = toISOWithPlus7(dialogSchedule.date, startHM);
      const endTime = toISOWithPlus7(dialogSchedule.date, endHM);

      const payload = {
        cvApplicantId: dialogCandidate.candidateId,
        startTime,
        endTime,
        interviewStageId: dialogSchedule.nextInterviewStageId,
        notes: "",
        interviewerIds: dialogSchedule.interviewers.map((i) => i.id),
      };

      const res = await authFetch(scheduleEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Tạo lịch thất bại (${res.status})`);
      }

      const result = await res.json();
      console.log("Schedule created:", result);
      setDialogOpen(false);
    } catch (e: any) {
    //   alert(e?.message ?? "Không thể tạo lịch.");
      toast.error("Không thể tạo lịch. Lý do: " + (e?.message || "Không xác định"));
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Gợi ý lịch phỏng vấn</h1>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {safeDateTimes.length} giờ đã chọn
        </Badge>
      </header>

      {loading ? (
        <Card className="md:py-4">
          <CardHeader>
            <CardTitle>Đang tải gợi ý…</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Đang lấy kế hoạch phỏng vấn dựa trên thời gian đã chọn…
          </CardContent>
        </Card>
      ) : errorMsg ? (
        <Card className="border-red-300 md:py-4">
          <CardHeader>
            <CardTitle className="text-red-600">Không tải được</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-600">{errorMsg}</CardContent>
        </Card>
      ) : !data ? (
        <Card className="md:py-4">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Chưa có dữ liệu</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Vui lòng chọn vị trí và tối thiểu một thời gian để nhận gợi ý.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            Tạo được {data.interviewPlan.totalCandidates} gợi ý.
          </div>

          {/* Responsive grid: 1 → 2 → 3 → 4 → 5 columns */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-stretch max-w-screen-2xl mx-auto">
            {data.interviewPlan.candidates.map((c) => {
              const selectedIdx = selectedMap[c.candidateId];
              const selected = c.suggestedSchedules[selectedIdx];

              return (
                <Card
                  key={c.candidateId}
                  data-candidate-id={c.candidateId}
                  data-position-id={data.positionId}
                  className="overflow-hidden h-full"
                >
                  {/* Hidden inputs for potential form submits later */}
                  <input type="hidden" name="positionId" value={data.positionId} />
                  <input type="hidden" name="candidateId" value={c.candidateId} />

                  <CardHeader className="space-y-2 md:space-y-3 md:py-6">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5" />
                      <span className="truncate">{c.fullName}</span>
                    </CardTitle>

                    <div className="flex flex-wrap gap-2 text-xs md:text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {c.email || "—"}
                      </span>
                      <Separator orientation="vertical" />
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {c.phone || "—"}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 md:space-y-5 md:pb-2">
                    <div className="text-xs md:text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Tổng thời gian phỏng vấn:&nbsp;
                      <span className="font-medium text-foreground">
                        {c.totalInterviewDurationMinutes} phút
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="text-sm md:text-base font-medium">Gợi ý lịch phỏng vấn</div>

                      <div className="space-y-3">
                        {c.suggestedSchedules.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Không có gợi ý.</p>
                        ) : (
                          c.suggestedSchedules.map((s, idx) => {
                            const isSelected = selectedIdx === idx;
                            return (
                              <label
                                key={`${c.candidateId}-${idx}`}
                                className={[
                                  "block rounded-lg border p-3 md:p-4 cursor-pointer transition",
                                  isSelected ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/50",
                                ].join(" ")}
                              >
                                <input
                                  type="radio"
                                  name={`pick-${c.candidateId}`}
                                  className="sr-only"
                                  checked={isSelected}
                                  onChange={() => handlePickSchedule(c.candidateId, idx)}
                                />

                                {/* Hidden inputs per schedule if needed later */}
                                <input type="hidden" name="nextInterviewStageId" value={s.nextInterviewStageId} />
                                <input type="hidden" name="currentInterviewStageName" value={s.currentInterviewStageName} />

                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1.5">
                                    <div className="text-sm md:text-base font-medium">
                                      {s.date} • {s.timeSlot}
                                    </div>
                                    <div className="text-xs md:text-sm text-muted-foreground">
                                      Vòng hiện tại: <span className="text-foreground">{s.currentInterviewStageName}</span>
                                      {"  "}→ Tiếp theo:{" "}
                                      <span className="text-foreground">{s.nextInterviewStageName}</span>
                                    </div>
                                    <div className="text-xs md:text-sm">
                                      Người phỏng vấn:{" "}
                                      {s.interviewers.length ? (
                                        <span className="text-foreground">
                                          {s.interviewers.map((i) => i.name).join(", ")}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </div>
                                  </div>

                                  <div
                                    className={[
                                      "mt-1 h-4 w-4 rounded-full border",
                                      isSelected ? "bg-primary border-primary" : "border-muted-foreground/30",
                                    ].join(" ")}
                                    aria-hidden
                                  />
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 md:py-5">
                    <div className="text-xs md:text-sm text-muted-foreground flex-1">
                      {selected ? (
                        <>
                          Đã chọn:{" "}
                          <span className="text-foreground font-medium">
                            {selected.date} • {selected.timeSlot}
                          </span>
                        </>
                      ) : (
                        <>Chọn một khung giờ ở trên</>
                      )}
                    </div>

                    <Button
                      size="sm"
                      className="w-full md:w-auto"
                      disabled={!selected}
                      onClick={() => openDialog(c)}
                      data-candidate-id={c.candidateId}
                      data-selected-index={selectedIdx ?? -1}
                    >
                      Tạo lịch
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </section>
        </>
      )}

      {/* Dialog chọn giờ + POST */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chọn thời gian phỏng vấn</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm">
              <div>
                Ứng viên:{" "}
                <span className="font-medium">
                  {dialogCandidate?.fullName ?? "—"}
                </span>
              </div>
              <div>
                Ngày:{" "}
                <span className="font-medium">
                  {dialogSchedule?.date ?? "—"}
                </span>
              </div>
              <div className="text-muted-foreground">
                Gợi ý hệ thống: {dialogSchedule?.timeSlot ?? "—"}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startHM">Giờ bắt đầu</Label>
                <Input
                  id="startHM"
                  type="time"
                  value={startHM}
                  onChange={(e) => setStartHM(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endHM">Giờ kết thúc</Label>
                <Input
                  id="endHM"
                  type="time"
                  value={endHM}
                  onChange={(e) => setEndHM(e.target.value)}
                />
              </div>
            </div>

            {/* <p className="text-xs text-muted-foreground">
              Lưu ý: Hệ thống sẽ tự cộng <span className="font-medium">+7 giờ</span> trước khi gửi.
              Ví dụ: 08:00 → 17:00; 22:00 → 05:00 ngày hôm sau.
            </p> */}
          </div>

          <DialogFooterUI>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={posting}>
              Hủy
            </Button>
            <Button onClick={confirmCreate} disabled={posting || !dialogCandidate || !dialogSchedule}>
              {posting ? "Đang tạo…" : "Xác nhận tạo lịch"}
            </Button>
          </DialogFooterUI>
        </DialogContent>
      </Dialog>
      <ToastContainer/>
    </div>
  );
}
