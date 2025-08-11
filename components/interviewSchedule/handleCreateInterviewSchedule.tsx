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
import { getApplicantsByCampaign, getCampaigns, getDepartmentsByCampaign, getEmployeesByDepartment, getInterviewTypes, getPositionsByCampaign } from "./dataSource";

// ---------------- Types ----------------
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
  interviewSchedules: any[];
}

export interface Account {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
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

// ------------- Helpers / constants -------------
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

// ------------- Page component -------------
export default function HandleCreateInterviewSchedule() {
  const router = useRouter();

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
    startTime?: string; // ISO
    endTime?: string;   // ISO
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

  // date/time split
  const [datePart, setDatePart] = useState("");
  const [timePart, setTimePart] = useState("");
  const [duration, setDuration] = useState<number | "">("");

  const interviewerIds = useMemo(
    () => new Set(form.interviewers.map((x) => x.id)),
    [form.interviewers]
  );

  // ---------- fetch master data ----------
  // useEffect(() => {
  //   (async () => {
  //     setLoadingCampaigns(true);
  //     try {
  //       const [cps, itypes] = await Promise.all([
  //         authFetch("/api/campaigns").then(unwrap),
  //         authFetch("/api/interview-types").then(unwrap),
  //       ]);
  //       setCampaigns(cps ?? []);
  //       setInterviewTypes(itypes ?? []);
  //     } finally {
  //       setLoadingCampaigns(false);
  //     }
  //   })();
  // }, []);

  // // when campaign changes -> load positions, departments, applicants
  // useEffect(() => {
  //   const { campaignId } = form;
  //   if (!campaignId) {
  //     setPositions([]);
  //     setDepartments([]);
  //     setApplicants([]);
  //     return;
  //   }
  //   (async () => {
  //     setLoadingPositions(true);
  //     setLoadingDepartments(true);
  //     setLoadingApplicants(true);
  //     try {
  //       const [pos, deps, apps] = await Promise.all([
  //         // positions linked to this campaign
  //         authFetch(`/api/campaign-positions?campaignId=${campaignId}`).then(
  //           unwrap
  //         ),
  //         // departments participating in this campaign
  //         authFetch(`/api/departments?campaignId=${campaignId}`).then(unwrap),
  //         // applicants of this campaign with status "Chưa phỏng vấn"
  //         authFetch(
  //           `/api/cv-applicants?campaignId=${campaignId}&status=${encodeURIComponent(
  //             "Chưa phỏng vấn"
  //           )}`
  //         ).then(unwrap),
  //       ]);
  //       setPositions(pos ?? []);
  //       setDepartments(deps ?? []);
  //       setApplicants(apps ?? []);
  //       // reset dependent selections
  //       setForm((s) => ({
  //         ...s,
  //         campaignPositionId: undefined,
  //         departmentId: undefined,
  //         cvApplicantId: undefined,
  //         interviewers: [],
  //       }));
  //     } finally {
  //       setLoadingPositions(false);
  //       setLoadingDepartments(false);
  //       setLoadingApplicants(false);
  //     }
  //   })();
  // }, [form.campaignId]);

  // when position changes -> auto-set department (from the position)
  useEffect(() => {
    if (!form.campaignPositionId) return;
    const pos = positions.find((p) => p.id === form.campaignPositionId);
    if (pos?.departmentId) {
      setForm((s) => ({
        ...s,
        departmentId: pos.departmentId,
        interviewers: [],
      }));
    }
  }, [form.campaignPositionId, positions]);

  // when department changes -> load employees
  // useEffect(() => {
  //   const { departmentId } = form;
  //   if (!departmentId) {
  //     setEmployees([]);
  //     return;
  //   }
  //   (async () => {
  //     setLoadingEmployees(true);
  //     try {
  //       const emps = await authFetch(
  //         `/api/departments/${departmentId}/employees`
  //       ).then(unwrap);
  //       setEmployees(emps ?? []);
  //       setForm((s) => ({ ...s, interviewers: [] }));
  //     } finally {
  //       setLoadingEmployees(false);
  //     }
  //   })();
  // }, [form.departmentId]);

  useEffect(() => {
  (async () => {
    const [cps, itypes] = await Promise.all([getCampaigns(), getInterviewTypes()]);
    setCampaigns(cps);
    setInterviewTypes(itypes);
  })();
}, []);

// when campaign changes
useEffect(() => {
  if (!form.campaignId) { setPositions([]); setDepartments([]); setApplicants([]); return; }
  (async () => {
    const [pos, deps, apps] = await Promise.all([
      getPositionsByCampaign(form.campaignId as any),
      getDepartmentsByCampaign(form.campaignId as any),
      getApplicantsByCampaign(form.campaignId as any),
    ]);
    setPositions(pos);
    setDepartments(deps);
    setApplicants(apps);
    setForm(s => ({ ...s, campaignPositionId: undefined, departmentId: undefined, cvApplicantId: undefined, interviewers: [] }));
  })();
}, [form.campaignId]);

// when department changes
useEffect(() => {
  if (!form.departmentId) { setEmployees([]); return; }
  (async () => {
    const emps = await getEmployeesByDepartment(form.departmentId!);
    setEmployees(emps);
    setForm(s => ({ ...s, interviewers: [] }));
  })();
}, [form.departmentId]);

  // when date/time/duration changes -> compute start/end ISO
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
      // ignore parsing error
    }
  }, [datePart, timePart, duration]);

  // ---------- handlers ----------
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
    if (!form.campaignId) e.campaignId = "Hãy chọn đợt tuyển dụng.";
    if (!form.campaignPositionId) e.campaignPositionId = "Hãy chọn vị trí tuyển dụng.";
    if (!form.departmentId) e.departmentId = "Hãy chọn phòng ban.";
    if (!form.cvApplicantId) e.cvApplicantId = "Hãy chọn ứng viên.";
    if (!form.round) e.round = "Hãy chọn vòng phòng vấn.";
    if (!form.interviewTypeId) e.interviewTypeId = "Hãy chọn loại phỏng vấn.";
    if (!form.startTime) e.startTime = "Hãy chọn ngày/giờ/thời gian phỏng vấn.";
    if (!form.interviewers?.length) e.interviewers = "Hãy chọn ít nhất 1 người phỏng vấn.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      // server expects interviewers as ids; map if necessary
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
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Thất bại. Vui lòng thử lại");
      }
      alert("Tạo lịch phỏng vấn thành công.");
      router.push("/dashboard/schedules");
    } catch (err: any) {
      alert(err?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  };

  // ------------- UI -------------
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h3 className="flex justify-center text-lg font-semibold text-gray-800 mb-2">Tạo lịch phỏng vấn</h3>

      <div className="space-y-2">
        <Label>Đợt tuyển dụng <span className="text-red-500">*</span></Label>
        <Select
          value={form.campaignId ?? ""}
          onValueChange={(v) => setForm((s) => ({ ...s, campaignId: v }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingCampaigns ? "Đang tải..." : "Chọn đợt tuyển dụng"} />
          </SelectTrigger>
          <SelectContent>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.campaignId && <p className="text-xs text-red-500">{errors.campaignId}</p>}
      </div>

      <div className="space-y-2">
        <Label>Vị trí tuyển dụng <span className="text-red-500">*</span></Label>
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

      <div className="space-y-2">
        <Label>Phòng ban <span className="text-red-500">*</span></Label>
        <Select
          value={form.departmentId ?? ""}
          onValueChange={(v) =>
            setForm((s) => ({ ...s, departmentId: v, interviewers: [] }))
          }
          disabled={!form.campaignId || loadingDepartments}
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

      <div className="space-y-2">
        <Label>Ứng viên <span className="text-red-500">*</span></Label>
        <Select
          value={form.cvApplicantId ?? ""}
          onValueChange={(v) => setForm((s) => ({ ...s, cvApplicantId: v }))}
          disabled={!form.campaignId}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                !form.campaignId
                  ? "Chọn đợt tuyển dụng trước"
                  : loadingApplicants
                  ? "Đang tải..."
                  : "Chọn ứng viên"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {applicants.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.fullName} {a.email ? `• ${a.email}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.cvApplicantId && (
          <p className="text-xs text-red-500">{errors.cvApplicantId}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Người phỏng vấn <span className="text-red-500">*</span></Label>
        {!form.departmentId ? (
          <p className="text-xs text-gray-500">
            Chọn phòng ban để chọn người phỏng vấn.
          </p>
        ) : loadingEmployees ? (
          <p className="text-sm text-gray-600">Đang tải…</p>
        ) : employees.length === 0 ? (
          <p className="text-sm text-gray-600">Phòng ban này chưa có nhân viên.</p>
        ) : (
          <div className="max-h-48 overflow-auto rounded-md border border-gray-200 p-2 space-y-1">
            {employees.map((emp) => {
              const checked = interviewerIds.has(emp.id);
              const fullName =
                `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() ||
                emp.username ||
                emp.email ||
                emp.id;
              return (
                <label
                  key={emp.id}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={checked}
                    onChange={() => toggleInterviewer(emp)}
                  />
                  <span>{fullName}</span>
                  {emp.email && (
                    <span className="text-xs text-gray-500">• {emp.email}</span>
                  )}
                </label>
              );
            })}
          </div>
        )}
        {errors.interviewers && (
          <p className="text-xs text-red-500">{errors.interviewers}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Vòng phòng vấn <span className="text-red-500">*</span></Label>
          <Select
            value={form.round?.toString() ?? ""}
            onValueChange={(v) => setForm((s) => ({ ...s, round: Number(v) }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn vòng phòng vấn" />
            </SelectTrigger>
            <SelectContent>
              {roundOptions.map((r) => (
                <SelectItem key={r} value={String(r)}>
                  Vòng {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.round && (
            <p className="text-xs text-red-500">{errors.round}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Loại phỏng vấn <span className="text-red-500">*</span></Label>
          <Select
            value={form.interviewTypeId ?? ""}
            onValueChange={(v) => setForm((s) => ({ ...s, interviewTypeId: v }))}
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Ngày <span className="text-red-500">*</span></Label>
          <Input type="date" value={datePart} onChange={(e) => setDatePart(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Thời gian <span className="text-red-500">*</span></Label>
          <Select value={timePart} onValueChange={(v) => setTimePart(v)}>
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
          <Label>Thời lượng (phút)</Label>
          <Select
            value={duration === "" ? "" : String(duration)}
            onValueChange={(v) => setDuration(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Thời lượng" />
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
      {errors.startTime && <p className="text-xs text-red-500">{errors.startTime}</p>}

      {/* Notes */}
      <div className="space-y-2">
        <Label>Ghi chú</Label>
        <Textarea
          rows={3}
          value={form.notes ?? ""}
          onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
          placeholder="Thêm ghi chú cho cuộc phỏng vấn..."
        />
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Hủy
        </Button>
        <Button onClick={handleSubmit} disabled={busy} className="bg-blue-600 hover:bg-blue-700">
          {busy ? "Đang lưu..." : "Tạo"}
        </Button>
      </div>
    </div>
  );
}
