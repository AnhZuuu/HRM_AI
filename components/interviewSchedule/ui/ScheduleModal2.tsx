// 📁 components/interviews/ScheduleModal2.tsx (Updated with VN datetime + validation)
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Users, ChevronsUpDown, Loader2 } from "lucide-react";

import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";
import { nowVietnamLocal } from "@/app/utils/helper";
import { toast, ToastContainer } from "react-toastify";

export type Candidate = {
  id: string;
  cvApplicantId: string;
  fullName: string | null;
  email: string | null;
  point: string | null;
  campaignPositionDescription: string | null;
  currentInterviewStageName: string | null;
  fileUrl: string | null;
  departmentId?: string | null;
};
export type Interviewer = { id: string; fullName: string; title?: string };

// Always call the base endpoint for accounts
async function fetchInterviewers(): Promise<Interviewer[]> {
  const res = await authFetch(API.ACCOUNT.BASE, { method: "GET" });
  if (!res.ok) throw new Error(`Failed to load interviewers: ${res.status}`);
  const json = await res.json();
  const arr = Array.isArray(json?.data) ? json.data : [];
  return arr.map((acc: any) => ({
    id: acc.id,
    fullName: `${acc.firstName ?? ""} ${acc.lastName ?? ""}`.trim() || acc.username || acc.email,
    title: acc.accountRoles?.[0]?.roleName ?? undefined,
  }));
}

// Predefined static stage options (since API not ready)
const STATIC_STAGES = [
  { id: "c4f10b3b-aba8-4bf1-1066-08dde1803f00", name: "Vòng 1" },
  { id: "c1f41fca-48a9-48ea-1067-08dde1803f00", name: "Vòng 2" },
  { id: "21099b0d-e3b7-4354-fff1-08dde0e5412d", name: "Vòng 3" },
  { id: "7227e337-ffce-42f0-fff0-08dde0e5412d", name: "Vòng 4" },
];

async function postInterviewScheduleV2(payload: {
  cvApplicantId: string;
  startTime: string;
  endTime: string;
  interviewStageId: string;
  notes?: string;
  interviewerIds: string[];
}) {
  const res = await authFetch(API.INTERVIEW.SCHEDULE, { method: "POST", body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// helper to get VN timezone datetime string for input min attr



export default function ScheduleModal2({ open, onOpenChange, candidate }: { open: boolean; onOpenChange: (v: boolean) => void; candidate: Candidate | null; }) {
  const [loading, setLoading] = useState(false);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [interviewStageId, setInterviewStageId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [selectedInterviewers, setSelectedInterviewers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open || !candidate) return;
    setInterviewStageId(STATIC_STAGES[0].id);
    setStart(""); setEnd(""); setSelectedInterviewers([]); setNotes("");
    (async () => {
      try {
        setLoading(true);
        const accounts = await fetchInterviewers();
        setInterviewers(accounts);
      } finally { setLoading(false); }
    })();
  }, [open, candidate]);

  async function handleSave() {
    if (!candidate) return;
    if (!interviewStageId || !start || !end) {
      toast.error("Vui lòng chọn vòng và thời gian."); // error toast instead of alert
      return;
    }
    if (new Date(start) >= new Date(end)) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }

    try {
      await postInterviewScheduleV2({
        cvApplicantId: candidate.cvApplicantId,
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
        interviewStageId,
        notes: notes?.trim() || undefined,
        interviewerIds: selectedInterviewers,
      });

      toast.success("Đã lưu lịch phỏng vấn thành công!"); // ✅ success popup
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Không thể lưu lịch phỏng vấn."); // ❌ error popup
    }
  }

  return (<>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Lên lịch phỏng vấn</DialogTitle>
          <DialogDescription>
            {candidate ? (
              <>Ứng viên: <span className="font-medium">{candidate.fullName || "(Không tên)"}</span>{candidate.campaignPositionDescription && <> · Vị trí: <span className="font-medium">{candidate.campaignPositionDescription}</span></>}</>
            ) : (<>Chọn ứng viên để lên lịch.</>)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-3">
            <label className="col-span-1 text-sm text-muted-foreground">Vòng</label>
            <div className="col-span-3">
              <select className={cn("block w-full rounded-md border bg-background px-3 py-2 text-sm")} value={interviewStageId} onChange={(e) => setInterviewStageId(e.target.value)}>
                {STATIC_STAGES.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <label className="col-span-1 text-sm text-muted-foreground">Bắt đầu</label>
            <div className="col-span-3">
              <Input type="datetime-local" min={nowVietnamLocal()} value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <label className="col-span-1 text-sm text-muted-foreground">Kết thúc</label>
            <div className="col-span-3">
              <Input type="datetime-local" min={start || nowVietnamLocal()} value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-3">
            <label className="col-span-1 mt-2 text-sm text-muted-foreground">Người phỏng vấn</label>
            <div className="col-span-3"><InterviewerMultiSelect options={interviewers} value={selectedInterviewers} onChange={setSelectedInterviewers} disabled={loading} /></div>
          </div>
          <div className="grid grid-cols-4 items-start gap-3">
            <label className="col-span-1 mt-2 text-sm text-muted-foreground">Ghi chú</label>
            <div className="col-span-3"><textarea className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Nội dung…" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Hủy</Button>
          <Button onClick={handleSave} disabled={loading || !candidate}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Lưu lịch</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ToastContainer position="top-right" autoClose={3000} />
  </>
  );
}

function InterviewerMultiSelect({ options, value, onChange, disabled }: { options: Interviewer[]; value: string[]; onChange: (v: string[]) => void; disabled?: boolean; }) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => options.filter((o) => value.includes(o.id)), [options, value]);
  const label = selected.length ? `${selected.length} người được chọn` : "Chọn người phỏng vấn";
  function toggle(id: string) { if (value.includes(id)) onChange(value.filter((v) => v !== id)); else onChange([...value, id]); }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between"><div className="flex items-center gap-2"><Users className="h-4 w-4" /><span className={cn("truncate text-sm", !selected.length && "text-muted-foreground")}>{label}</span></div><ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" /></Button></PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Separator />
        <ScrollArea className="h-56">
          <div className="p-1">{options.map((o) => { const checked = value.includes(o.id); return (<button key={o.id} type="button" disabled={disabled} className={cn("flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted/70", disabled && "opacity-60")} onClick={() => toggle(o.id)}><div className="min-w-0"><div className="truncate font-medium">{o.fullName}</div>{o.title && <div className="truncate text-xs text-muted-foreground">{o.title}</div>}</div><Checkbox checked={checked} aria-label={`select ${o.fullName}`} /></button>); })}</div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
