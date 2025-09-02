"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, ChevronsUpDown, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";
import { today, todayStartVNForDatetimeLocal } from "@/app/utils/time";
import { toast } from "react-toastify";

/* ================= Types ================= */
export interface Department {
  id: string;
  departmentName: string;
  code: string;
  description: string | null;
  campaignPositions?: any[] | null; // keep as any[] to avoid cross-file imports
  employees: any[] | null;
  campaignPositionModels: any[] | null;
}

export type Candidate = {
  id: string;
  cvApplicantId: string;
  fullName: string | null;
  email: string | null;
  point: string | null;
  campaignPositionDescription: string | null;
  currentInterviewStageName: string | null;
  fileUrl: string | null;
  status: 0 | 1 | 2 | 3 | 4 | null; // 0 Pending, 1 Rejected, 2 Accepted, 3 Failed, 4 Onboarded

  // ensure these get populated in normalizeCandidates()
  departmentId?: string | null;
  department: Department[] | null;
};

type NextStageResponse = {
  id: string;
  stageName: string | null;
  description?: string | null;
  totalTime?: number | null;
};

type Interviewer = { id: string; fullName: string; title?: string };

/* Payload actually returned by your /accounts?departmentId=... endpoint */
type AccountDTO = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  accountRoles?: Array<{ roleName?: string | null }>;
};

/* ============= Helpers ============= */
function getCandidateDepartmentId(candidate: Candidate | null): string | null {
  if (!candidate) return null;
  if (candidate.departmentId) return candidate.departmentId || null;

  const first = Array.isArray(candidate.department) ? candidate.department[0] : null;
  return first?.id ?? null;
}

/* ============= Fetchers adapted to your API ============= */

// GET /interview/stage/{cvApplicantId}/next-stages  → { data: { id, stageName, ... } }
async function fetchNextStage(cvApplicantId: string): Promise<NextStageResponse | null> {
  const res = await authFetch(`${API.INTERVIEW.STAGE}/${cvApplicantId}/next-stages`, { method: "GET" });
  if (!res.ok) throw new Error(`Failed to load next stage: ${res.status}`);
  const json = await res.json();
  const data = json?.data;
  if (!data || !data.id) return null;
  return {
    id: String(data.id),
    stageName: data.stageName ?? null,
    description: data.description ?? null,
    totalTime : data.totalTime ?? null
  };
}

async function fetchDepartmentInterviewers(departmentId?: string | null): Promise<Interviewer[]> {
  if (!departmentId) return []; // no department → no interviewers
  const url = `${API.ACCOUNT.BASE}?departmentId=${departmentId}`;
  const res = await authFetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Failed to load interviewers: ${res.status}`);

  const json = await res.json();
  const accounts: AccountDTO[] = Array.isArray(json?.data) ? json.data : [];

  return accounts.map((e) => {
    const displayName =
      e.username ||
      [e.firstName, e.lastName].filter(Boolean).join(" ").trim() ||
      e.email ||
      e.phoneNumber ||
      "No name";

    const title = (e.accountRoles || [])
      .map((r) => r?.roleName)
      .filter(Boolean)
      .join(", ");

    return { id: String(e.id), fullName: displayName, title: title || undefined };
  });
}

async function postInterviewSchedule(payload: {
  cvApplicantId: string;
  interviewStageId: string;
  startTime: string;
  endTime: string;
  interviewerIds: string[];
  notes?: string;
}) {
  const res = await authFetch(API.INTERVIEW.SCHEDULE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Schedule failed: ${res.status}`);
  }
  return res.json();
}

/* ================= Component ================= */
export function ScheduleModal({
  open,
  onOpenChange,
  candidate,
   onScheduled,   
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  candidate: Candidate | null;
   onScheduled?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  // stage (single)
  const [interviewStageId, setinterviewStageId] = useState<string>("");
  const [stageName, setStageName] = useState<string>("");

  // interviewers
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [selectedInterviewers, setSelectedInterviewers] = useState<string[]>([]);

  // time + notes
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // UI errors (simple inline hints)
  const [errors, setErrors] = useState<{ interviewStageId?: string; start?: string; end?: string; interviewerIds?: string }>({});

  // Resolve departmentId for UI checks too
  const deptId = useMemo(() => getCandidateDepartmentId(candidate), [candidate]);

  // Reset and fetch when opened
  useEffect(() => {
    if (!open || !candidate) return;

    setinterviewStageId("");
    setStageName("");
    setInterviewers([]);
    setSelectedInterviewers([]);
    setStart("");
    setEnd("");
    setNotes("");
    setErrors({});

    (async () => {
      try {
        setLoading(true);

        // 1) next stage (single object)
        const next = await fetchNextStage(candidate.cvApplicantId);
        if (next?.id) {
          setinterviewStageId(next.id);
          setStageName(next.stageName || "Unnamed stage");
        }

        // 2) interviewers by department (using computed deptId)
        const people = await fetchDepartmentInterviewers(getCandidateDepartmentId(candidate));
        setInterviewers(people);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, candidate]);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!interviewStageId) e.interviewStageId = "Vui lòng chọn vòng phỏng vấn.";
    if (!start) e.start = "Vui lòng chọn thời gian bắt đầu.";
    if (!end) e.end = "Vui lòng chọn thời gian kết thúc.";
    if (start && end && new Date(end) <= new Date(start)) {
      e.end = "Thời gian kết thúc phải sau thời gian bắt đầu.";
    }
    if (!selectedInterviewers.length) e.interviewerIds = "Vui lòng chọn ít nhất 1 người phỏng vấn.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

 async function handleSave() {
  if (!candidate) return;
  if (!validate()) return;

  setLoading(true);
  try {
    const payload = {
      cvApplicantId: candidate.cvApplicantId,
      interviewStageId,
      startTime: new Date(start).toISOString(),
      endTime: new Date(end).toISOString(),
      interviewerIds: selectedInterviewers,
      notes: notes?.trim() || undefined,
    };

    // 👇 See exactly what you're about to POST
    console.log("[ScheduleModal] POST /interview/schedule payload:", payload, {
      startLocal: start,
      endLocal: end,
    });

    const result = await postInterviewSchedule(payload);
     onScheduled?.();


    // 👇 See parsed response (if any)
    console.log("[ScheduleModal] POST result:", result);

    onOpenChange(false);
  } catch (e: any) {
    console.error("[ScheduleModal] POST error:", e);
    toast.error("Tạo lịch thất bại");
  } finally {
    setLoading(false);
  }
}


  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Lên lịch phỏng vấn</DialogTitle>
          <DialogDescription>
            {candidate ? (
              <span className="space-x-1">
                <span>Ứng viên:</span>
                <span className="font-medium">{candidate.fullName || "(Không tên)"}</span>
                {candidate.campaignPositionDescription && (
                  <>
                    <span>· Vị trí:</span>
                    <span className="font-medium">{candidate.campaignPositionDescription}</span>
                  </>
                )}
              </span>
            ) : (
              <span>Chọn ứng viên để lên lịch.</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Stage (read-only single select style, but still a <select> in case you add alternates later) */}
          <div className="grid grid-cols-4 items-start gap-3">
            <label className="col-span-1 text-sm text-muted-foreground">
              Vòng <span className="text-red-500">*</span>
            </label>
            <div className="col-span-3">
              <select
                className={cn("block w-full rounded-md border bg-background px-3 py-2 text-sm", !interviewStageId && "opacity-50")}
                disabled={!interviewStageId || loading}
                value={interviewStageId}
                onChange={(e) => setinterviewStageId(e.target.value)}
              >
                {interviewStageId ? <option value={interviewStageId}>{stageName || "Không có tên"}</option> : <option>Không có vòng tiếp theo</option>}
              </select>
              {errors.interviewStageId && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" /> {errors.interviewStageId}
                </p>
              )}
            </div>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-4 items-start gap-3">
            <label className="col-span-1 text-sm text-muted-foreground">
              Bắt đầu <span className="text-red-500">*</span>
            </label>
            <div className="col-span-3 space-y-1">
              <Input type="datetime-local" 
              min={todayStartVNForDatetimeLocal()} 
              value={start} 
              onChange={(e) => setStart(e.target.value)} 
              disabled={loading} />
              {errors.start && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" /> {errors.start}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-3">
            <label className="col-span-1 text-sm text-muted-foreground">
              Kết thúc <span className="text-red-500">*</span>
            </label>
            <div className="col-span-3 space-y-1">
              <Input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                min={start || todayStartVNForDatetimeLocal()}
                disabled={loading}
              />
              {errors.end && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" /> {errors.end}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Lưu ý: thời gian được lưu dưới dạng UTC (chuyển đổi tự động từ giờ địa phương).</p>
            </div>
          </div>

          {/* Interviewers */}
          <div className="grid grid-cols-4 items-start gap-3">
            <label className="col-span-1 mt-2 text-sm text-muted-foreground">
              Người phỏng vấn <span className="text-red-500">*</span>
            </label>
            <div className="col-span-3">
              <InterviewerMultiSelect
                options={interviewers}
                value={selectedInterviewers}
                onChange={setSelectedInterviewers}
                disabled={loading || !deptId || interviewers.length === 0}
              />
              {!deptId && (
                <p className="mt-1 text-xs text-red-600">Ứng viên chưa có phòng ban — không thể lấy danh sách người phỏng vấn.</p>
              )}
              {deptId && interviewers.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">Phòng ban không có nhân viên phù hợp.</p>
              )}
              {errors.interviewerIds && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" /> {errors.interviewerIds}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Danh sách lấy theo phòng ban của ứng viên. Bạn có thể chọn nhiều người.</p>
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-4 items-start gap-3">
            <label className="col-span-1 mt-2 text-sm text-muted-foreground">Ghi chú</label>
            <div className="col-span-3">
              <textarea
                className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nội dung…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={loading || !candidate}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Lưu lịch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ================= Interviewer multi-select ================= */
function InterviewerMultiSelect({
  options,
  value,
  onChange,
  disabled,
}: {
  options: Interviewer[];
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => options.filter((o) => value.includes(o.id)), [options, value]);
  const label = selected.length ? `${selected.length} người được chọn` : "Chọn người phỏng vấn";

  function toggle(id: string) {
    value.includes(id) ? onChange(value.filter((v) => v !== id)) : onChange([...value, id]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className={cn("truncate text-sm", !selected.length && "text-muted-foreground")}>{label}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2">
          <Input placeholder="Tìm người…" className="h-8" disabled />
        </div>
        <Separator />
        <ScrollArea className="h-56">
          <div className="p-1">
            {options.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">Không có dữ liệu</div>
            )}
            {options.map((o) => {
              const checked = value.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={disabled}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted/70",
                    disabled && "opacity-60"
                  )}
                  onClick={() => toggle(o.id)}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{o.fullName}</div>
                    {o.title && <div className="truncate text-xs text-muted-foreground">{o.title}</div>}
                  </div>
                  <Checkbox checked={checked} aria-label={`select ${o.fullName}`} />
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
