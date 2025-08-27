"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";

export type Candidate = {
  id: string;
  cvApplicantId: string;
  fullName: string | null;
  email: string | null;
  point: string | null;
  campaignPositionDescription: string | null;
};

type StageOption = { id: string; name: string };
type Interviewer = { id: string; fullName: string; title?: string };

async function fetchNextStages(cvApplicantId: string): Promise<StageOption[]> {
  const res = await authFetch(`${API.INTERVIEW.STAGE}/${cvApplicantId}/next-stages`, { method: "GET" });
  if (!res.ok) throw new Error(`Failed to load stages: ${res.status}`);
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
}

async function fetchInterviewers(departmentId?: string | null): Promise<Interviewer[]> {
  const url = departmentId ? `${API.ACCOUNT}/${departmentId}` : `${API.ACCOUNT}`;
  const res = await authFetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Failed to load interviewers: ${res.status}`);
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
}

async function postInterviewSchedule(payload: {
  cvApplicantId: string;
  stageId: string;
  startTime: string;
  endTime: string;
  interviewerIds: string[];
  notes?: string;
}) {
  const res = await authFetch(API.INTERVIEW.SCHEDULE, { method: "POST", body: JSON.stringify(payload) });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Schedule failed: ${res.status}`);
  }
  return res.json();
}

export function ScheduleModal({
  open,
  onOpenChange,
  candidate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  candidate: Candidate | null;
}) {
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<StageOption[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [stageId, setStageId] = useState<string>("");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [selectedInterviewers, setSelectedInterviewers] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (!open || !candidate) return;
    setStages([]); setInterviewers([]); setStageId(""); setStart(""); setEnd(""); setSelectedInterviewers([]); setNotes("");

    (async () => {
      try {
        setLoading(true);
        const [stageOpts, interviewerOpts] = await Promise.all([
          fetchNextStages(candidate.cvApplicantId),
          fetchInterviewers(undefined), // hoặc candidate.departmentId nếu có
        ]);
        const s = Array.isArray(stageOpts) ? stageOpts : [];
        const i = Array.isArray(interviewerOpts) ? interviewerOpts : [];
        setStages(s); setInterviewers(i);
        if (s[0]?.id) setStageId(s[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, candidate]);

  async function handleSave() {
    if (!candidate) return;
    if (!stageId || !start || !end) return alert("Vui lòng chọn vòng và thời gian.");
    setLoading(true);
    try {
      await postInterviewSchedule({
        cvApplicantId: candidate.cvApplicantId,
        stageId,
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
        interviewerIds: selectedInterviewers,
        notes: notes?.trim() || undefined,
      });
      onOpenChange(false);
    } catch (e: any) {
      alert(e?.message || "Schedule failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Lên lịch phỏng vấn</DialogTitle>
          <DialogDescription>
            {candidate ? (
              <span>
                Ứng viên: <span className="font-medium">{candidate.fullName || "(Không tên)"}</span>
                {candidate.campaignPositionDescription && <> · Vị trí: <span className="font-medium">{candidate.campaignPositionDescription}</span></>}
              </span>
            ) : <span>Chọn ứng viên để lên lịch.</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-3">
            <label className="col-span-1 text-sm text-muted-foreground">Vòng</label>
            <div className="col-span-3">
              <select
                className={cn("block w-full rounded-md border bg-background px-3 py-2 text-sm", !stages.length && "opacity-50")}
                disabled={!stages.length || loading}
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
              >
                {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                {!stages.length && <option>Không có vòng tiếp theo</option>}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-3">
            <label className="col-span-1 text-sm text-muted-foreground">Bắt đầu</label>
            <div className="col-span-3"><Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-4 items-center gap-3">
            <label className="col-span-1 text-sm text-muted-foreground">Kết thúc</label>
            <div className="col-span-3"><Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-4 items-start gap-3">
            <label className="col-span-1 mt-2 text-sm text-muted-foreground">Người phỏng vấn</label>
            <div className="col-span-3">
              <InterviewerMultiSelect options={interviewers} value={selectedInterviewers} onChange={setSelectedInterviewers} disabled={loading} />
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-3">
            <label className="col-span-1 mt-2 text-sm text-muted-foreground">Ghi chú</label>
            <div className="col-span-3">
              <textarea className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Nội dung…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Hủy</Button>
          <Button onClick={handleSave} disabled={loading || !candidate}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Lưu lịch</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InterviewerMultiSelect({
  options, value, onChange, disabled,
}: { options: Interviewer[]; value: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => options.filter((o) => value.includes(o.id)), [options, value]);
  const label = selected.length ? `${selected.length} người được chọn` : "Chọn người phỏng vấn";
  function toggle(id: string) { value.includes(id) ? onChange(value.filter((v) => v !== id)) : onChange([...value, id]); }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          <div className="flex items-center gap-2"><Users className="h-4 w-4" /><span className={cn("truncate text-sm", !selected.length && "text-muted-foreground")}>{label}</span></div>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2"><Input placeholder="Tìm người…" className="h-8" /></div>
        <Separator />
        <ScrollArea className="h-56">
          <div className="p-1">
            {options.length === 0 && <div className="px-3 py-6 text-center text-sm text-muted-foreground">Không có dữ liệu</div>}
            {options.map((o) => {
              const checked = value.includes(o.id);
              return (
                <button key={o.id} type="button" disabled={disabled}
                  className={cn("flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted/70", disabled && "opacity-60")}
                  onClick={() => toggle(o.id)}>
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
