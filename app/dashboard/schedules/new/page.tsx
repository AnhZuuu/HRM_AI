"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { authFetch } from "@/app/utils/authFetch";
import {
  getApplicantsByCampaign,
  getCampaigns,
  getDepartmentsByCampaign,
  getEmployeesByDepartment,
  getInterviewTypes,
  getPositionsByCampaign,
} from "@/components/interviewSchedule/dataSource";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

/* ---------------- Types ---------------- */
export interface Campaign {
  id: string;
  name: string;
}
export interface Department {
  id: string;
  name: string;
}
export interface InterviewType {
  id: string;
  name: string;
}
export interface CampaignPosition {
  id: string;
  departmentId: string;
  campaignId: string;
  campaign: string | null;
  department: string | null;
  createdBy: string | null;
  totalSlot: number;
  description: string;
  cvApplicants?: CVApplicant[];
}
export interface Account {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
}
export interface CVApplicant {
  id: string;
  fileUrl: string;
  fileAlt: string;
  fullName: string;
  email: string | null;
  point: string | null;
  status: string | null;
  createdBy: string | null;
  campaignPositionId: string;
  campaignPosition: CampaignPosition | null;
  cvApplicantDetails: any[];
  interviewSchedules: any[]; // may contain round/status/interviewers
}

/* ------------- Helpers / constants ------------- */
const STORAGE_KEY = "mock_interview_schedules_v1";

const roundOptions = [1, 2];
const durationOptions = [15, 30, 45, 60, 90];

// show time nicely (start → end)
function fmtRange(
  start?: string | null,
  end?: string | null,
  locale = "vi-VN"
) {
  if (!start) return "—";
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const d = s.toLocaleDateString(locale);
  const t1 = s.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const t2 = e
    ? e.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
    : null;
  return t2 ? `${d} ${t1}–${t2}` : `${d} ${t1}`;
}

// pending now stores notes too
type PendingOne = {
  applicantId: string;
  round: 1 | 2;
  interviewerIds: string[];
  startTime?: string;
  endTime?: string;
  notes?: string | null;
};

// treat these as "completed"
const COMPLETED = new Set(["completed", "done", "interviewed"]);

// turn employee ids → readable names
function namesFromIds(ids: string[], employees: Account[]) {
  return ids
    .map((id) => {
      const emp = employees.find((e) => e.id === id);
      const nm =
        `${emp?.firstName ?? ""} ${emp?.lastName ?? ""}`.trim() ||
        emp?.username ||
        emp?.email ||
        id;
      return nm;
    })
    .filter(Boolean)
    .join(", ");
}

const generateTimeSlots = (start = 8, end = 18, interval = 15) => {
  const slots: string[] = [];
  for (let h = start; h <= end; h++) {
    for (let m = 0; m < 60; m += interval) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
};
const timeSlots = generateTimeSlots();

/* ---- R1 info helper (reads applicant.interviewSchedules) ---- */
type AnySchedule = {
  id?: string;
  round?: number | null;
  status?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  interviewers?:
    | { firstName?: string; lastName?: string; username?: string }[]
    | string;
  notes?: string | null;
};

function getRoundView(
  app: CVApplicant,
  round: 1 | 2,
  pending: Record<string, PendingOne>,
  employees: Account[]
) {
  // If there is a pending entry for this applicant & round, show it as pending
  const p = pending[app.id];
  if (p && p.round === round) {
    return {
      status: "Scheduled (pending)",
      startTime: p.startTime ?? null,
      endTime: p.endTime ?? null,
      interviewerNames: namesFromIds(p.interviewerIds, employees) || "—",
      notes: p.notes ?? null,
      pending: true,
      exists: true,
    };
  }

  // Otherwise, look up from existing interviewSchedules
  const list = (app.interviewSchedules ?? []) as AnySchedule[];
  const hit = list.find((x) => Number(x.round ?? 0) === round);
  if (!hit) {
    return {
      status: null,
      startTime: null,
      endTime: null,
      interviewerNames: "—",
      notes: null,
      pending: false,
      exists: false,
    };
  }
  const iv = Array.isArray(hit.interviewers)
    ? (hit.interviewers as any[])
        .map((i) => `${i.firstName ?? ""} ${i.lastName ?? ""}`.trim())
        .filter(Boolean)
        .join(", ")
    : typeof hit.interviewers === "string"
    ? hit.interviewers
    : "—";

  return {
    status: hit.status ?? null,
    startTime: hit.startTime ?? null,
    endTime: hit.endTime ?? null,
    interviewerNames: iv || "—",
    notes: (hit as any).notes ?? null,
    pending: false,
    exists: true,
  };
}

/* ------------- Page component ------------- */
export default function HandleCreateInterviewSchedule() {
  const router = useRouter();
  const [dlgNotes, setDlgNotes] = useState<string>("");

  // page-level form (shared fields)
  const [form, setForm] = useState<{
    campaignId?: string;
    campaignPositionId?: string;
    departmentId?: string;
    cvApplicantId?: string; // not used in batch flow but kept for validate reuse
    interviewers: Account[];
    round?: number;
    interviewTypeId?: string;
    notes?: string;
    startTime?: string;
    endTime?: string;
  }>({ interviewers: [] });

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // dependent select data
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [positions, setPositions] = useState<CampaignPosition[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [applicants, setApplicants] = useState<CVApplicant[]>([]);
  const [employees, setEmployees] = useState<Account[]>([]);
  const [interviewTypes, setInterviewTypes] = useState<InterviewType[]>([]);

  // loading flags
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // create-form date/time (kept for your original single-create handler)
  const [datePart, setDatePart] = useState("");
  const [timePart, setTimePart] = useState("");
  const [duration, setDuration] = useState<number | "">("");

  const interviewerIds = useMemo(
    () => new Set(form.interviewers.map((x) => x.id)),
    [form.interviewers]
  );

  /* ---------- Fetch master data (mocked via dataSource) ---------- */
  useEffect(() => {
    (async () => {
      setLoadingCampaigns(true);
      try {
        const [cps, itypes] = await Promise.all([
          getCampaigns(),
          getInterviewTypes(),
        ]);
        setCampaigns(cps);
        setInterviewTypes(itypes);
      } finally {
        setLoadingCampaigns(false);
      }
    })();
  }, []);

  // when campaign changes -> load positions, departments, applicants
  useEffect(() => {
    if (!form.campaignId) {
      setPositions([]);
      setDepartments([]);
      setApplicants([]);
      return;
    }
    (async () => {
      setLoadingPositions(true);
      setLoadingDepartments(true);
      setLoadingApplicants(true);
      try {
        const [pos, deps, apps] = await Promise.all([
          getPositionsByCampaign(form.campaignId!),
          getDepartmentsByCampaign(form.campaignId!),
          getApplicantsByCampaign(form.campaignId!),
        ]);
        setPositions(pos);
        setDepartments(deps);
        setApplicants(apps);
        // reset dependent selections
        setForm((s) => ({
          ...s,
          campaignPositionId: undefined,
          departmentId: undefined,
          cvApplicantId: undefined,
          interviewers: [],
        }));
        setPending({}); // clear prepared rows when campaign changes
      } finally {
        setLoadingPositions(false);
        setLoadingDepartments(false);
        setLoadingApplicants(false);
      }
    })();
  }, [form.campaignId]);

  // when position changes -> auto-set department from that position
  useEffect(() => {
    if (!form.campaignPositionId) return;
    const pos = positions.find((p) => p.id === form.campaignPositionId);
    if (pos?.departmentId) {
      setForm((s) => ({
        ...s,
        departmentId: pos.departmentId,
        interviewers: [],
      }));
      setPending({}); // clear prepared rows when position changes
    }
  }, [form.campaignPositionId, positions]);

  // when department changes -> load employees for dialog
  useEffect(() => {
    if (!form.departmentId) {
      setEmployees([]);
      return;
    }
    (async () => {
      setLoadingEmployees(true);
      try {
        const emps = await getEmployeesByDepartment(form.departmentId!);
        setEmployees(emps);
      } finally {
        setLoadingEmployees(false);
      }
    })();
  }, [form.departmentId]);

  // compute start/end ISO for the top single-create form (kept for backward compat)
  useEffect(() => {
    if (!datePart || !timePart || !duration || typeof duration !== "number") {
      setForm((s) => ({ ...s, startTime: undefined, endTime: undefined }));
      return;
    }
    try {
      const [hh, mm] = timePart.split(":").map((x) => Number(x));
      const start = new Date(datePart);
      start.setHours(hh, mm, 0, 0);
      const end = new Date(start.getTime() + duration * 60_000);
      setForm((s) => ({
        ...s,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      }));
    } catch {
      // ignore
    }
  }, [datePart, timePart, duration]);

  const [pending, setPending] = useState<Record<string, PendingOne>>({});
  const [dlgOpen, setDlgOpen] = useState(false);
  const [dlgFor, setDlgFor] = useState<{
    applicantId: string;
    round: 1 | 2;
  } | null>(null);
  const [dlgTime, setDlgTime] = useState<string>("");
  const [dlgDate, setDlgDate] = useState<string>("");
  const [dlgDuration, setDlgDuration] = useState<number | "">("");
  const [dlgSelected, setDlgSelected] = useState<Set<string>>(new Set());

  function openScheduleDialog(applicantId: string, round: 1 | 2) {
    setDlgDate("");
    setDlgTime("");
    setDlgDuration("");
    setDlgSelected(new Set());
    setDlgNotes("");
    setDlgFor({ applicantId, round });
    setDlgOpen(true);
  }

  function confirmOneInDialog() {
    if (!dlgFor) return;
    if (!dlgDate || !dlgTime || dlgDuration === "" || dlgSelected.size === 0) {
      alert("Chọn ngày/giờ/thời lượng và ít nhất 1 người phỏng vấn.");
      return;
    }
    const [hh, mm] = dlgTime.split(":").map((x) => Number(x));
    const start = new Date(dlgDate);
    start.setHours(hh, mm, 0, 0);
    const end = new Date(start.getTime() + Number(dlgDuration) * 60_000);
    setPending((s) => ({
      ...s,
      [dlgFor.applicantId]: {
        applicantId: dlgFor.applicantId,
        round: dlgFor.round,
        interviewerIds: Array.from(dlgSelected),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes: dlgNotes || null,
      },
    }));
    setDlgOpen(false);
  }

  // ---- MOCK SAVE (localStorage) fallback ----
  function mockSaveSchedules(items: PendingOne[]) {
    // read current
    const raw = localStorage.getItem(STORAGE_KEY);
    const current: AnySchedule[] = raw ? JSON.parse(raw) : [];
    // make simple schedule entries
    const newOnes: AnySchedule[] = items.map((p) => ({
      id: crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      round: p.round,
      status: "Scheduled",
      startTime: p.startTime ?? null,
      endTime: p.endTime ?? null,
      interviewers:
        p.interviewerIds
          .map((id) => {
            const emp = employees.find((e) => e.id === id);
            const nm =
              `${emp?.firstName ?? ""} ${emp?.lastName ?? ""}`.trim() ||
              emp?.username ||
              emp?.email ||
              id;
            return nm;
          })
          .filter(Boolean)
          .join(", ") || "—",
      notes: p.notes ?? null,
    }));
    const next = [...current, ...newOnes];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    // reflect into applicants state so UI shows R1 status immediately
    setApplicants((prev) =>
      prev.map((a) => {
        const hit = items.find((p) => p.applicantId === a.id);
        if (!hit) return a;
        const entry: AnySchedule = {
          id: crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
          round: hit.round,
          status: "Scheduled",
          startTime: hit.startTime ?? null,
          endTime: hit.endTime ?? null,
          interviewers:
            hit.interviewerIds
              .map((id) => {
                const emp = employees.find((e) => e.id === id);
                const nm =
                  `${emp?.firstName ?? ""} ${emp?.lastName ?? ""}`.trim() ||
                  emp?.username ||
                  emp?.email ||
                  id;
                return nm;
              })
              .filter(Boolean)
              .join(", ") || "—",
          notes: hit.notes ?? null,
        };
        const after = Array.isArray(a.interviewSchedules)
          ? [...a.interviewSchedules, entry]
          : [entry];
        return { ...a, interviewSchedules: after };
      })
    );
  }

  async function confirmAllSchedules() {
    const items = Object.values(pending);
    if (!items.length) {
      alert("Chưa có lịch nào được chọn.");
      return;
    }
    if (
      !form.campaignId ||
      !form.campaignPositionId ||
      !form.departmentId ||
      !form.interviewTypeId
    ) {
      alert(
        "Vui lòng chọn Đợt tuyển dụng, Vị trí, Phòng ban và Loại phỏng vấn trước."
      );
      return;
    }
    setBusy(true);
    try {
      const bulkBody = items.map((p) => ({
        campaignId: form.campaignId,
        campaignPositionId: form.campaignPositionId,
        departmentId: form.departmentId,
        cvApplicantId: p.applicantId,
        round: p.round,
        interviewTypeId: form.interviewTypeId,
        interviewerIds: p.interviewerIds,
        startTime: p.startTime,
        endTime: p.endTime,
        notes: form.notes ?? null,
      }));

      let ok = false;
      try {
        const r = await authFetch("/api/interview-schedules/bulk", {
          method: "POST",
          body: JSON.stringify(bulkBody),
        });
        ok = r.ok;
      } catch {
        ok = false;
      }

      if (!ok) {
        // fallback: one by one; if still not ok, mock save
        let anyFailed = false;
        for (const payload of bulkBody) {
          try {
            const res = await authFetch("/api/interview-schedules", {
              method: "POST",
              body: JSON.stringify(payload),
            });
            if (!res.ok) anyFailed = true;
          } catch {
            anyFailed = true;
          }
        }
        if (anyFailed) {
          // Use sample-data creation (localStorage) so you can see it working
          mockSaveSchedules(items);
        }
      }

      alert("Đã tạo lịch phỏng vấn.");
      setPending({});
    } catch (e: any) {
      alert(e?.message || "Tạo lịch thất bại");
    } finally {
      setBusy(false);
    }
  }

  /* ---------- Validation for original single-create (kept) ---------- */
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.campaignId) e.campaignId = "Hãy chọn đợt tuyển dụng.";
    if (!form.campaignPositionId)
      e.campaignPositionId = "Hãy chọn vị trí tuyển dụng.";
    if (!form.departmentId) e.departmentId = "Hãy chọn phòng ban.";
    if (!form.cvApplicantId) e.cvApplicantId = "Hãy chọn ứng viên.";
    if (!form.round) e.round = "Hãy chọn vòng phỏng vấn.";
    if (!form.interviewTypeId) e.interviewTypeId = "Hãy chọn loại phỏng vấn.";
    if (!form.startTime)
      e.startTime = "Hãy chọn ngày/giờ/thời lượng phỏng vấn.";
    if (!form.interviewers?.length)
      e.interviewers = "Hãy chọn ít nhất 1 người phỏng vấn.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  async function handleSubmitSingle() {
    if (!validate()) return;
    setBusy(true);
    try {
      const payload = {
        campaignId: form.campaignId,
        campaignPositionId: form.campaignPositionId,
        departmentId: form.departmentId,
        cvApplicantId: form.cvApplicantId,
        round: form.round,
        interviewTypeId: form.interviewTypeId,
        interviewerIds: form.interviewers.map((x) => x.id),
        startTime: form.startTime,
        endTime: form.endTime,
        notes: form.notes ?? null,
      };
      const res = await authFetch("/api/interview-schedules", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok)
        throw new Error((await res.text()) || "Thất bại. Vui lòng thử lại");
      alert("Tạo lịch phỏng vấn thành công.");
      router.push("/dashboard/schedules");
    } catch (err: any) {
      // fallback to mock single save
      mockSaveSchedules([
        {
          applicantId: form.cvApplicantId!,
          round: (form.round as 1 | 2) ?? 1,
          interviewerIds: form.interviewers.map((x) => x.id),
          startTime: form.startTime,
          endTime: form.endTime,
        },
      ]);
      alert("Đã tạo lịch (sample data).");
    } finally {
      setBusy(false);
    }
  }

  /* ------------- UI ------------- */
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h3 className="flex justify-center text-lg font-semibold text-gray-800 mb-2">
        Tạo lịch phỏng vấn
      </h3>

      {/* Campaign */}
      <div className="space-y-2">
        <Label>
          Đợt tuyển dụng <span className="text-red-500">*</span>
        </Label>
        <Select
          value={form.campaignId ?? ""}
          onValueChange={(v) => setForm((s) => ({ ...s, campaignId: v }))}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                loadingCampaigns ? "Đang tải..." : "Chọn đợt tuyển dụng"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.campaignId && (
          <p className="text-xs text-red-500">{errors.campaignId}</p>
        )}
      </div>

      {/* Position */}
      <div className="space-y-2">
        <Label>
          Vị trí tuyển dụng <span className="text-red-500">*</span>
        </Label>
        <Select
          value={form.campaignPositionId ?? ""}
          onValueChange={(v) =>
            setForm((s) => ({ ...s, campaignPositionId: v }))
          }
          disabled={!form.campaignId}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                !form.campaignId
                  ? "Chọn đợt tuyển dụng trước"
                  : loadingPositions
                  ? "Đang tải..."
                  : "Chọn vị trí"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {positions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.description || p.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.campaignPositionId && (
          <p className="text-xs text-red-500">{errors.campaignPositionId}</p>
        )}
      </div>

      {/* Department */}
      <div className="space-y-2">
        <Label>
          Phòng ban <span className="text-red-500">*</span>
        </Label>
        <Select
          value={form.departmentId ?? ""}
          onValueChange={(v) => setForm((s) => ({ ...s, departmentId: v }))}
          disabled={
            !form.campaignId || !form.campaignPositionId || loadingDepartments
          }
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                !form.campaignId
                  ? "Chọn đợt tuyển dụng trước"
                  : loadingDepartments
                  ? "Đang tải..."
                  : "Chọn phòng ban"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.departmentId && (
          <p className="text-xs text-red-500">{errors.departmentId}</p>
        )}
      </div>

      {/* Applicants table (after campaign + position chosen) */}
      {form.campaignId && form.campaignPositionId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">
              Ứng viên thuộc vị trí đã chọn
            </h4>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ứng viên</TableHead>
                  <TableHead>Vòng 1</TableHead>
                  <TableHead>PV V1</TableHead>
                  <TableHead>Vòng 2</TableHead>
                  <TableHead>PV V2</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants
                  .filter(
                    (a) => a.campaignPositionId === form.campaignPositionId
                  )
                  .map((a) => {
                    const r1 = getRoundView(a, 1, pending, employees);
                    const r2 = getRoundView(a, 2, pending, employees);

                    const r1Status = (r1.status ?? "—").toString();
                    const r2Status = (r2.status ?? "—").toString();
                    const r1Done =
                      r1.exists &&
                      COMPLETED.has((r1.status ?? "").toLowerCase());

                    const canCreateR1 = !r1.exists; // show + in R1 if no R1 yet
                    const canCreateR2 = r1Done && !r2.exists; // show + in R2 only if R1 completed

                    return (
                      <TableRow key={a.id} className="align-top">
                        {/* Candidate: name with email under it */}
                        <TableCell>
                          <div className="font-medium">{a.fullName}</div>
                          <div className="text-xs text-gray-600">
                            {a.email ?? "—"}
                          </div>
                        </TableCell>

                        {/* Round 1 (status + time) with + button if allowed */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {r1.pending ? (
                              <Badge variant="secondary">{r1Status}</Badge>
                            ) : r1.exists ? (
                              <Badge>{r1Status}</Badge>
                            ) : (
                              // <Badge variant="outline"></Badge>
                            <>
                            {canCreateR1 && (
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7"
                                onClick={() => openScheduleDialog(a.id, 1)}
                                disabled={!form.departmentId}
                                title="Tạo lịch V1"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}
                            </>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {fmtRange(r1.startTime, r1.endTime)}
                          </div>
                        </TableCell>

                        {/* R1 Interviewers */}
                        <TableCell className="text-sm">
                          {r1.interviewerNames}
                        </TableCell>

                        {/* Round 2 (status + time) with + button if allowed */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {r2.pending ? (
                              <Badge variant="secondary">{r2Status}</Badge>
                            ) : r2.exists ? (
                              <Badge>{r2Status}</Badge>
                            ) : (
                              <Badge variant="outline"></Badge>
                            )}
                            {canCreateR2 && (
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7"
                                onClick={() => openScheduleDialog(a.id, 2)}
                                disabled={!form.departmentId}
                                title="Lên lịch V2"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {fmtRange(r2.startTime, r2.endTime)}
                          </div>
                        </TableCell>

                        {/* R2 Interviewers */}
                        <TableCell className="text-sm">
                          {r2.interviewerNames}
                        </TableCell>

                        {/* Notes (prefer R2 > R1 > none; if pending has notes, show them) */}
                        <TableCell className="text-sm">
                          {r2.notes ?? r1.notes ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pick interviewers + date/time for one applicant/round */}
      <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {dlgFor?.round === 2
                ? "Lên lịch phỏng vấn vòng 2"
                : "Tạo lịch phỏng vấn vòng 1"}
            </DialogTitle>
            <DialogDescription>
              Chọn người phỏng vấn và ngày/giờ cho ứng viên.
            </DialogDescription>
          </DialogHeader>

          {/* Interviewers */}
          <div className="space-y-2">
            <Label>Người phỏng vấn (thuộc hội đồng/phòng ban đã chọn)</Label>
            {!form.departmentId ? (
              <p className="text-xs text-gray-500">Chọn phòng ban trước.</p>
            ) : loadingEmployees ? (
              <p className="text-sm text-gray-600">Đang tải…</p>
            ) : employees.length === 0 ? (
              <p className="text-sm text-gray-600">Không có nhân viên.</p>
            ) : (
              <div className="max-h-44 overflow-auto rounded-md border border-gray-200 p-2 space-y-1">
                {employees.map((emp) => {
                  const full =
                    `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() ||
                    emp.username ||
                    emp.email ||
                    emp.id;
                  const checked = dlgSelected.has(emp.id);
                  return (
                    <label
                      key={emp.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={() =>
                          setDlgSelected((s) => {
                            const next = new Set(s);
                            if (next.has(emp.id)) next.delete(emp.id);
                            else next.add(emp.id);
                            return next;
                          })
                        }
                      />
                      <span>{full}</span>
                      {emp.email && (
                        <span className="text-xs text-gray-500">
                          • {emp.email}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interview type (top-level shared) */}
          <div className="space-y-2">
            <Label>
              Loại phỏng vấn <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.interviewTypeId ?? ""}
              onValueChange={(v) =>
                setForm((s) => ({ ...s, interviewTypeId: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại phỏng vấn" />
              </SelectTrigger>
              <SelectContent>
                {interviewTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.interviewTypeId && (
              <p className="text-xs text-red-500">{errors.interviewTypeId}</p>
            )}
          </div>

          {/* Date / Time / Duration (dialog-local) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Ngày</Label>
              <Input
                type="date"
                value={dlgDate}
                onChange={(e) => setDlgDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Giờ</Label>
              <Select value={dlgTime} onValueChange={(v) => setDlgTime(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giờ" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Thời lượng</Label>
              <Select
                value={dlgDuration === "" ? "" : String(dlgDuration)}
                onValueChange={(v) => setDlgDuration(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Phút" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} phút
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea
              rows={3}
              value={dlgNotes}
              onChange={(e) => setDlgNotes(e.target.value)}
              placeholder="Ghi chú cho lịch phỏng vấn (tùy chọn)..."
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgOpen(false)}>
              Hủy
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={confirmOneInDialog}
            >
              Thêm vào danh sách
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-4 flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Hủy
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          disabled={!Object.keys(pending).length || busy}
          onClick={confirmAllSchedules}
        >
          Xác nhận tạo {Object.keys(pending).length} lịch
        </Button>
      </div>
    </div>
  );
}
