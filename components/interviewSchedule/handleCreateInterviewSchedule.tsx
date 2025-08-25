"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useInterviewMasterData } from "./hooks/useInterviewMasterData";
import { useSchedulePending } from "./hooks/useSchedulePending";
import { authFetch } from "@/app/utils/authFetch";
import { FormState, PendingOne } from "./sampleData/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import ScheduleDialog from "./ui/scheduleDialog";
import ApplicantsTable from "./ui/applicantTable";
import { toast } from "react-toastify";

const STORAGE_KEY = "mock_interview_schedules_v1";

export default function HandleCreateInterviewSchedule() {
  const [form, setForm] = useState<FormState>({ interviewers: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { campaigns, interviewTypes, positions, departments, applicants, employees, loading } =
    useInterviewMasterData(form.campaignId, form.departmentId);

  const { pending, setPending } = useSchedulePending();
  const [dlgOpen, setDlgOpen] = useState(false);
  const [dlgFor, setDlgFor] = useState<{ applicantId: string; round: 1 | 2 } | null>(null);

   const validate = () => {
    const e: Record<string, string> = {};
    if (!form.campaignId) e.campaignId = "Hãy chọn đợt tuyển dụng.";
    if (!form.campaignPositionId) e.campaignPositionId = "Hãy chọn vị trí tuyển dụng.";
    if (!form.departmentId) e.departmentId = "Hãy chọn phòng ban.";
    if (!form.cvApplicantId) e.cvApplicantId = "Hãy chọn ứng viên.";
    if (!form.round) e.round = "Hãy chọn vòng phỏng vấn.";
    if (!form.interviewTypeId) e.interviewTypeId = "Hãy chọn loại phỏng vấn.";
    if (!form.startTime) e.startTime = "Hãy chọn ngày/giờ/thời lượng phỏng vấn.";
    if (!form.interviewers?.length) e.interviewers = "Hãy chọn ít nhất 1 người phỏng vấn.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // mở dialog
  function openScheduleDialog(applicantId: string, round: 1 | 2) {
    setDlgFor({ applicantId, round });
    setDlgOpen(true);
  }

  // xác nhận trong dialog (ghi vào pending)
  function onConfirmDialog({
    interviewerIds, date, time, duration, notes,
  }: { interviewerIds: string[]; date: string; time: string; duration: number; notes?: string | null; }) {
    if (!dlgFor) return;
    const [hh, mm] = time.split(":").map((x) => Number(x));
    const start = new Date(date); start.setHours(hh, mm, 0, 0);
    const end = new Date(start.getTime() + Number(duration) * 60_000);

    setPending((s) => ({
      ...s,
      [dlgFor.applicantId]: {
        applicantId: dlgFor.applicantId,
        round: dlgFor.round,
        interviewerIds,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes: notes ?? null,
      },
    }));
  }

  // mock save nếu API fail
  function mockSaveSchedules(items: PendingOne[], toNames: (ids: string[]) => string) {
    const raw = localStorage.getItem(STORAGE_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const newOnes = items.map((p) => ({
      id: crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      round: p.round, status: "Scheduled",
      startTime: p.startTime ?? null, endTime: p.endTime ?? null,
      interviewers: toNames(p.interviewerIds) || "—",
      notes: p.notes ?? null,
    }));
    const next = [...current, ...newOnes];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function confirmAllSchedules() {
    const items = Object.values(pending);
    if (!items.length) { toast.warning("Chưa có lịch nào được chọn."); return; }
    if (!form.campaignId || !form.campaignPositionId || !form.departmentId) {
      toast.warning("Vui lòng chọn Đợt tuyển dụng, Vị trí, Phòng ban trước."); return;
    }

    const toNames = (ids: string[]) =>
      ids.map((id) => {
        const emp = employees.find((e) => e.id === id);
        const nm = `${emp?.firstName ?? ""} ${emp?.lastName ?? ""}`.trim() || emp?.username || emp?.email || id;
        return nm;
      }).filter(Boolean).join(", ");

    const body = items.map((p) => ({
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
        body: JSON.stringify(body),
      });
      ok = r.ok;
    } catch { ok = false; }

    if (!ok) {
      // thử từng cái, cuối cùng mock
      let anyFailed = false;
      for (const payload of body) {
        try {
          const res = await authFetch("/api/interview-schedules", {
            method: "POST", body: JSON.stringify(payload),
          });
          if (!res.ok) anyFailed = true;
        } catch { anyFailed = true; }
      }
      if (anyFailed) mockSaveSchedules(items, toNames);
    }

    toast.success("Đã tạo lịch phỏng vấn.");
    setPending({});
  }

  // reset khi chọn campaign hoặc position
  const onChangeCampaign = (v: string) => {
    setForm({ interviewers: [], campaignId: v });
    setPending({});
  };
  const onChangePosition = (v: string) => {
    const pos = positions.find((p) => p.id === v);
    setForm((s) => ({ ...s, campaignPositionId: v, departmentId: pos?.departmentId, interviewers: [] }));
    setPending({});
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h3 className="flex justify-center text-lg font-semibold text-gray-800 mb-2">Tạo lịch phỏng vấn</h3>

      <div className="space-y-2">
        <Label>Đợt tuyển dụng <span className="text-red-500">*</span></Label>
        <Select value={form.campaignId ?? ""} onValueChange={onChangeCampaign}>
          <SelectTrigger>
            <SelectValue placeholder={loading.campaigns ? "Đang tải..." : "Chọn đợt tuyển dụng"} />
          </SelectTrigger>
          <SelectContent>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.campaignId && <p className="text-xs text-red-500">{errors.campaignId}</p>}
      </div>

      <div className="space-y-2">
        <Label>Vị trí tuyển dụng <span className="text-red-500">*</span></Label>
        <Select value={form.campaignPositionId ?? ""} onValueChange={onChangePosition} disabled={!form.campaignId}>
          <SelectTrigger>
            <SelectValue placeholder={!form.campaignId ? "Chọn đợt tuyển dụng trước" : (loading.positions ? "Đang tải..." : "Chọn vị trí")} />
          </SelectTrigger>
          <SelectContent>
            {positions.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.description || p.id}</SelectItem>
            ))}
          </SelectContent>
        </Select>
         {errors.campaignPositionId && (
          <p className="text-xs text-red-500">{errors.campaignPositionId}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Phòng ban <span className="text-red-500">*</span></Label>
        <Select value={form.departmentId ?? ""} onValueChange={(v) => setForm((s) => ({ ...s, departmentId: v }))} disabled={!form.campaignId || !form.campaignPositionId}>
          <SelectTrigger>
            <SelectValue placeholder={!form.campaignId || !form.campaignPositionId ? "Chọn đợt + vị trí trước" : (loading.departments ? "Đang tải..." : "Chọn phòng ban")} />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.departmentId && (
          <p className="text-xs text-red-500">{errors.departmentId}</p>
        )}
      </div>

      {form.campaignId && form.campaignPositionId && (
        <>
          <h4 className="text-lg font-semibold">Ứng viên thuộc vị trí đã chọn</h4>
          <ApplicantsTable
            applicants={applicants}
            campaignPositionId={form.campaignPositionId}
            employees={employees}
            pending={pending}
            onCreateR1={(id) => openScheduleDialog(id, 1)}
            onCreateR2={(id) => openScheduleDialog(id, 2)}
            departmentChosen={!!form.departmentId}
          />
        </>
      )}

      <ScheduleDialog
        open={dlgOpen}
        onOpenChange={setDlgOpen}
        round={dlgFor?.round ?? null}
        employees={employees}
        interviewTypes={interviewTypes}
        onConfirm={onConfirmDialog}
        requireDept={!form.departmentId}
        loadingEmployees={loading.employees}
      />

      <div className="mt-4 flex justify-end gap-3">
        <Button variant="outline" onClick={() => history.back()}>Hủy</Button>
        <Button className="bg-blue-600 hover:bg-blue-700" disabled={!Object.keys(pending).length} onClick={confirmAllSchedules}>
          Xác nhận tạo {Object.keys(pending).length} lịch
        </Button>
      </div>
    </div>
  );
}
