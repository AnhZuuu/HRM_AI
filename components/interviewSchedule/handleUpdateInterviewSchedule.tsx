"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/app/utils/authFetch";
import { toast } from "react-toastify";

// -------- Types (keep in sync with your app) --------
interface Campaign { id: string; name: string }
interface Department { id: string; name: string }
interface InterviewType { id: string; name: string }
interface Account { id: string; firstName?: string; lastName?: string; username?: string; email?: string }
interface CampaignPosition {
  id: string;
  departmentId: string;
  campaignId: string;
  campaign: string | null;
  department: string | null;
  createdBy: string | null;
  totalSlot: number;
  description: string;
}
interface CVApplicant {
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
  interviewSchedules: any[];
}

// -------- Helpers --------
const unwrap = async (res: Response) => {
  const txt = await res.text();
  const json = txt ? JSON.parse(txt) : null;
  return json?.data?.data ?? json?.data ?? json;
};

const roundOptions = [1, 2, 3, 4, 5];
const durationOptions = [15, 30, 45, 60, 90];

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

// -------- Page --------
export default function EditInterviewPage({
    id
}: {
    id: string;
}) {
  const router = useRouter();
//   const { id } = useParams<{ id: string }>();
const bootRef = useRef<boolean>(true);

  // form state
  const [form, setForm] = useState<{
    campaignId?: string;
    campaignPositionId?: string;
    departmentId?: string;
    cvApplicantId?: string;
    interviewers: Account[];
    round?: number;
    interviewTypeId?: string;
    notes?: string;
    startTime?: string;
    endTime?: string;
  }>({ interviewers: [] });

  // options
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [positions, setPositions] = useState<CampaignPosition[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [applicants, setApplicants] = useState<CVApplicant[]>([]);
  const [employees, setEmployees] = useState<Account[]>([]);
  const [interviewTypes, setInterviewTypes] = useState<InterviewType[]>([]);

  // ui state
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // date/time split for UI
  const [datePart, setDatePart] = useState("");
  const [timePart, setTimePart] = useState("");
  const [duration, setDuration] = useState<number | "">("");

  const interviewerIds = useMemo(
    () => new Set(form.interviewers.map((x) => x.id)),
    [form.interviewers]
  );

  // 1) Load masters + interview detail
  useEffect(() => {
    (async () => {
      setLoadingCampaigns(true);
      try {
        const [cps, itypes, detail] = await Promise.all([
          authFetch("/api/campaigns").then(unwrap),
          authFetch("/api/interview-types").then(unwrap),
          authFetch(`/api/interview-schedules/${id}`).then(unwrap),
        ]);

        setCampaigns(cps ?? []);
        setInterviewTypes(itypes ?? []);

        // hydrate form from detail
        const d = detail as any;
        const startISO: string | undefined = d?.startTime;
        const endISO: string | undefined = d?.endTime;

        let initialDate = "";
        let initialTime = "";
        let initialDuration: number | "" = "";

        if (startISO && endISO) {
          const start = new Date(startISO);
          const end = new Date(endISO);
          initialDate = start.toISOString().slice(0, 10);
          initialTime = `${String(start.getHours()).padStart(2, "0")}:${String(
            start.getMinutes()
          ).padStart(2, "0")}`;
          const diff = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
          initialDuration = diff || "";
        }

        setDatePart(initialDate);
        setTimePart(initialTime);
        setDuration(initialDuration);

        setForm({
          campaignId: d?.campaignId,
          campaignPositionId: d?.campaignPositionId,
          departmentId: d?.departmentId,
          cvApplicantId: d?.cvApplicantId,
          interviewers: d?.interviewers ?? [], // array of Accounts or {id: string}
          round: d?.round,
          interviewTypeId: d?.interviewTypeId,
          notes: d?.notes ?? "",
          startTime: d?.startTime,
          endTime: d?.endTime,
        });
      } finally {
        setLoadingCampaigns(false);
      }
    })();
  }, [id]);

  // 2) When campaign changes → load positions, departments, applicants
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
          authFetch(`/api/campaign-positions?campaignId=${form.campaignId}`).then(unwrap),
          authFetch(`/api/departments?campaignId=${form.campaignId}`).then(unwrap),
          authFetch(
            `/api/cv-applicants?campaignId=${form.campaignId}&status=${encodeURIComponent("Chưa phỏng vấn")}`
          ).then(unwrap),
        ]);

        // ensure current selected applicant is included even if status changed
        const mergedApplicants: CVApplicant[] = (() => {
          if (!form.cvApplicantId) return apps ?? [];
          const found = (apps ?? []).some((x: CVApplicant) => x.id === form.cvApplicantId);
          if (found) return apps ?? [];
          // fetch current selected applicant quickly (best-effort)
          return [
            ...(apps ?? []),
            ...(form.cvApplicantId ? [{ id: form.cvApplicantId, fullName: "(hiện tại)", email: null } as any] : []),
          ];
        })();

        setPositions(pos ?? []);
        setDepartments(deps ?? []);
        setApplicants(mergedApplicants);

      } finally {
        setLoadingPositions(false);
        setLoadingDepartments(false);
        setLoadingApplicants(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.campaignId]);

  // 3) When position changes → auto-set department if missing
  useEffect(() => {
    if (!form.campaignPositionId) return;
    const pos = positions.find((p) => p.id === form.campaignPositionId);
    if (pos?.departmentId && !form.departmentId) {
      setForm((s) => ({ ...s, departmentId: pos.departmentId, interviewers: [] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.campaignPositionId, positions]);

  // 4) When department changes → load employees
  useEffect(() => {
    if (!form.departmentId) {
      setEmployees([]);
      return;
    }
    (async () => {
      setLoadingEmployees(true);
      try {
        const emps = await authFetch(`/api/departments/${form.departmentId}/employees`).then(unwrap);
        setEmployees(emps ?? []);
      } finally {
        setLoadingEmployees(false);
      }
    })();
  }, [form.departmentId]);

  // 5) When date/time/duration changes → recompute start/end ISO
  useEffect(() => {
    if (!datePart || !timePart || !duration || typeof duration !== "number") {
      setForm((s) => ({ ...s, startTime: undefined, endTime: undefined }));
      return;
    }
    const [hh, mm] = timePart.split(":").map(Number);
    const start = new Date(datePart);
    start.setHours(hh, mm, 0, 0);
    const end = new Date(start.getTime() + duration * 60_000);
    setForm((s) => ({ ...s, startTime: start.toISOString(), endTime: end.toISOString() }));
  }, [datePart, timePart, duration]);

  // handlers
  const toggleInterviewer = (emp: Account) => {
    setForm((s) => {
      const exists = s.interviewers.find((x) => x.id === emp.id);
      return exists
        ? { ...s, interviewers: s.interviewers.filter((x) => x.id !== emp.id) }
        : { ...s, interviewers: [...s.interviewers, emp] };
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.campaignId) e.campaignId = "Bắt buộc.";
    if (!form.campaignPositionId) e.campaignPositionId = "Bắt buộc.";
    if (!form.departmentId) e.departmentId = "Bắt buộc.";
    if (!form.cvApplicantId) e.cvApplicantId = "Bắt buộc.";
    if (!form.round) e.round = "Bắt buộc.";
    if (!form.interviewTypeId) e.interviewTypeId = "Bắt buộc.";
    if (!form.startTime) e.startTime = "Chọn ngày, giờ và thời lượng.";
    if (!form.interviewers?.length) e.interviewers = "Chọn ít nhất một người phỏng vấn.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
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

      const res = await authFetch(`/api/interview-schedules/${id}`, {
        method: "PUT", // or PATCH if your API supports partial updates
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Cập nhật thất bại.");
      }

      // Adjust this route to your list/details page
      router.push("/dashboard/interview-schedules");
    } catch (err: any) {
      toast.error(err?.message ?? "Lỗi cập nhật");
    } finally {
      setBusy(false);
    }
  };

  // ---------- UI (same layout as your create form) ----------
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h3 className="flex justify-center text-lg font-semibold text-gray-800 mb-2">Cập nhật lịch phỏng vấn</h3>

      {/* Campaign */}
      <div className="space-y-2">
        <Label>Đợt tuyển dụng <span className="text-red-500">*</span></Label>
        <Select
          value={form.campaignId ?? ""}
          onValueChange={(v) => setForm((s) => ({ ...s, campaignId: v, interviewers: [] }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingCampaigns ? "Đang tải..." : "Chọn đợt tuyển dụng"} />
          </SelectTrigger>
          <SelectContent>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.campaignId && <p className="text-xs text-red-500">{errors.campaignId}</p>}
      </div>

      {/* Position */}
      <div className="space-y-2">
        <Label>Vị trí tuyển dụng <span className="text-red-500">*</span></Label>
        <Select
          value={form.campaignPositionId ?? ""}
          onValueChange={(v) => setForm((s) => ({ ...s, campaignPositionId: v }))}
          disabled={!form.campaignId}
        >
          <SelectTrigger>
            <SelectValue placeholder={!form.campaignId ? "Chọn đợt trước" : (loadingPositions ? "Đang tải..." : "Chọn vị trí")} />
          </SelectTrigger>
          <SelectContent>
            {positions.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.description || p.id}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.campaignPositionId && <p className="text-xs text-red-500">{errors.campaignPositionId}</p>}
      </div>

      {/* Department */}
      <div className="space-y-2">
        <Label>Phòng ban <span className="text-red-500">*</span></Label>
        <Select
          value={form.departmentId ?? ""}
          onValueChange={(v) => setForm((s) => ({ ...s, departmentId: v, interviewers: [] }))}
          disabled={!form.campaignId || loadingDepartments}
        >
          <SelectTrigger>
            <SelectValue placeholder={!form.campaignId ? "Chọn đợt trước" : (loadingDepartments ? "Đang tải..." : "Chọn phòng ban")} />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.departmentId && <p className="text-xs text-red-500">{errors.departmentId}</p>}
      </div>

      {/* Candidate */}
      <div className="space-y-2">
        <Label>Ứng viên <span className="text-red-500">*</span></Label>
        <Select
          value={form.cvApplicantId ?? ""}
          onValueChange={(v) => setForm((s) => ({ ...s, cvApplicantId: v }))}
          disabled={!form.campaignId}
        >
          <SelectTrigger>
            <SelectValue placeholder={!form.campaignId ? "Chọn đợt trước" : (loadingApplicants ? "Đang tải..." : "Chọn ứng viên")} />
          </SelectTrigger>
          <SelectContent>
            {applicants.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.fullName} {a.email ? `• ${a.email}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.cvApplicantId && <p className="text-xs text-red-500">{errors.cvApplicantId}</p>}
      </div>

      {/* Interviewers */}
      <div className="space-y-2">
        <Label>Người phỏng vấn <span className="text-red-500">*</span></Label>
        {!form.departmentId ? (
          <p className="text-xs text-gray-500">Chọn phòng ban để chọn người phỏng vấn.</p>
        ) : loadingEmployees ? (
          <p className="text-sm text-gray-600">Đang tải…</p>
        ) : employees.length === 0 ? (
          <p className="text-sm text-gray-600">Phòng ban này chưa có nhân viên.</p>
        ) : (
          <div className="max-h-48 overflow-auto rounded-md border border-gray-200 p-2 space-y-1">
            {employees.map((emp) => {
              const checked = interviewerIds.has(emp.id);
              const fullName = `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.username || emp.email || emp.id;
              return (
                <label key={emp.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="h-4 w-4" checked={checked} onChange={() => toggleInterviewer(emp)} />
                  <span>{fullName}</span>
                  {emp.email && <span className="text-xs text-gray-500">• {emp.email}</span>}
                </label>
              );
            })}
          </div>
        )}
        {errors.interviewers && <p className="text-xs text-red-500">{errors.interviewers}</p>}
      </div>

      {/* Round + Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Vòng phỏng vấn <span className="text-red-500">*</span></Label>
          <Select value={form.round?.toString() ?? ""} onValueChange={(v) => setForm((s) => ({ ...s, round: Number(v) }))}>
            <SelectTrigger><SelectValue placeholder="Chọn vòng phỏng vấn" /></SelectTrigger>
            <SelectContent>
              {roundOptions.map((r) => <SelectItem key={r} value={String(r)}>Vòng {r}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.round && <p className="text-xs text-red-500">{errors.round}</p>}
        </div>

        <div className="space-y-2">
          <Label>Loại phỏng vấn <span className="text-red-500">*</span></Label>
          <Select value={form.interviewTypeId ?? ""} onValueChange={(v) => setForm((s) => ({ ...s, interviewTypeId: v }))}>
            <SelectTrigger><SelectValue placeholder="Chọn loại phỏng vấn" /></SelectTrigger>
            <SelectContent>
              {interviewTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.interviewTypeId && <p className="text-xs text-red-500">{errors.interviewTypeId}</p>}
        </div>
      </div>

      {/* Date / Time / Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Ngày <span className="text-red-500">*</span></Label>
          <Input type="date" value={datePart} onChange={(e) => setDatePart(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Thời gian <span className="text-red-500">*</span></Label>
          <Select value={timePart} onValueChange={(v) => setTimePart(v)}>
            <SelectTrigger><SelectValue placeholder="Chọn giờ" /></SelectTrigger>
            <SelectContent>
              {timeSlots.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Thời lượng (phút)</Label>
          <Select value={duration === "" ? "" : String(duration)} onValueChange={(v) => setDuration(Number(v))}>
            <SelectTrigger><SelectValue placeholder="Thời lượng" /></SelectTrigger>
            <SelectContent>
              {durationOptions.map((d) => <SelectItem key={d} value={String(d)}>{d} phút</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {errors.startTime && <p className="text-xs text-red-500">{errors.startTime}</p>}

      {/* Notes */}
      <div className="space-y-2">
        <Label>Ghi chú</Label>
        <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} placeholder="Thêm ghi chú cho cuộc phỏng vấn..." />
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>Hủy</Button>
        <Button type="button" onClick={handleSubmit} disabled={busy} className="bg-blue-600 hover:bg-blue-700">
          {busy ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}
