"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateTimeSlots } from "@/app/utils/time";
import { Account, InterviewType } from "../sampleData/mockData";
import { displayName } from "@/app/utils/name";
import { toast } from "react-toastify";


const timeSlots = generateTimeSlots();
const durationOptions = [15, 30, 45, 60, 90];

export default function ScheduleDialog({
  open, onOpenChange, round, employees, interviewTypes, onConfirm,
  requireDept, loadingEmployees,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  round: 1 | 2 | null;
  employees: Account[];
  interviewTypes: InterviewType[];
  onConfirm: (payload: {
    interviewerIds: string[]; date: string; time: string; duration: number; notes?: string | null;
  }) => void;
  requireDept: boolean;
  loadingEmployees?: boolean;
}) {
  const [dlgSelected, setDlgSelected] = useState<Set<string>>(new Set());
  const [dlgNotes, setDlgNotes] = useState("");
  const [dlgTime, setDlgTime] = useState("");
  const [dlgDate, setDlgDate] = useState("");
  const [dlgDuration, setDlgDuration] = useState<number | "">("");
  const [interviewTypeId, setInterviewTypeId] = useState<string>("");

  function confirm() {
    if (!dlgDate || !dlgTime || dlgDuration === "" || dlgSelected.size === 0 || !interviewTypeId) {
      toast.warning("Chọn loại PV, ngày/giờ/thời lượng và ít nhất 1 người phỏng vấn.");
      return;
    }
    onConfirm({
      interviewerIds: Array.from(dlgSelected),
      date: dlgDate,
      time: dlgTime,
      duration: Number(dlgDuration),
      notes: dlgNotes || null,
    });
    onOpenChange(false);
    // reset
    setDlgSelected(new Set()); setDlgNotes(""); setDlgTime(""); setDlgDate(""); setDlgDuration("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{round === 2 ? "Lên lịch phỏng vấn vòng 2" : "Tạo lịch phỏng vấn vòng 1"}</DialogTitle>
          <DialogDescription>Chọn người phỏng vấn và ngày/giờ cho ứng viên.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Người phỏng vấn (theo phòng ban)</Label>
          {requireDept ? (
            <p className="text-xs text-gray-500">Chọn phòng ban trước.</p>
          ) : loadingEmployees ? (
            <p className="text-sm text-gray-600">Đang tải…</p>
          ) : employees.length === 0 ? (
            <p className="text-sm text-gray-600">Không có nhân viên.</p>
          ) : (
            <div className="max-h-44 overflow-auto rounded-md border border-gray-200 p-2 space-y-1">
              {employees.map((emp) => {
                const full = displayName(emp) || emp.id;
                const checked = dlgSelected.has(emp.id);
                return (
                  <label key={emp.id} className="flex items-center gap-2 text-sm cursor-pointer">
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
                    {emp.email && <span className="text-xs text-gray-500">• {emp.email}</span>}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Loại phỏng vấn</Label>
          <Select value={interviewTypeId} onValueChange={setInterviewTypeId}>
            <SelectTrigger><SelectValue placeholder="Chọn loại phỏng vấn" /></SelectTrigger>
            <SelectContent>
              {interviewTypes.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Ngày</Label>
            <Input type="date" value={dlgDate} onChange={(e) => setDlgDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Giờ</Label>
            <Select value={dlgTime} onValueChange={setDlgTime}>
              <SelectTrigger><SelectValue placeholder="Chọn giờ" /></SelectTrigger>
              <SelectContent>
                {timeSlots.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Thời lượng</Label>
            <Select value={dlgDuration === "" ? "" : String(dlgDuration)} onValueChange={(v) => setDlgDuration(Number(v))}>
              <SelectTrigger><SelectValue placeholder="Phút" /></SelectTrigger>
              <SelectContent>
                { [15,30,45,60,90].map((d) => (<SelectItem key={d} value={String(d)}>{d} phút</SelectItem>)) }
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Ghi chú</Label>
          <Textarea rows={3} value={dlgNotes} onChange={(e) => setDlgNotes(e.target.value)} placeholder="Ghi chú (tuỳ chọn)..." />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={confirm}>Thêm vào danh sách</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
