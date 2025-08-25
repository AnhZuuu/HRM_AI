"use client";

import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";
import { OnboardRequestStatus, SalaryTpe, statusColor } from "@/app/utils/enum";
import { fmtDate, fmtVnd } from "@/app/utils/helper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Calendar, ClipboardList, History, Eye } from "lucide-react";
import { useState } from "react";

function coerceStatusLabel(status: number | string): { key: number | null; label: string } {
  if (typeof status === "number") return { key: status, label: OnboardRequestStatus[status] ?? String(status) };
  const found = Object.entries(OnboardRequestStatus).find(([, v]) => v.toLowerCase() === status.toLowerCase());
  return { key: found ? Number(found[0]) : null, label: status };
}

function coerceSalaryLabel(t: number | string): { key: number | null; label: string } {
  if (typeof t === "number") return { key: t, label: SalaryTpe[t] ?? String(t) };
  const found = Object.entries(SalaryTpe).find(([, v]) => v.toLowerCase() === String(t).toLowerCase());
  return { key: found ? Number(found[0]) : null, label: String(t) };
}

export default function OnboardDetailSheet({ row, onStatusChanged, }: { row: Onboard, onStatusChanged?: () => void; }) {
  const applicant = row.cvApplicantModel;
  const statusInfo = coerceStatusLabel(row.status);
  const salInfo = coerceSalaryLabel(row.salaryType);

  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

    async function updateStatus(id: string, status: number) {
    const url = `${API.ONBOARD.BASE}/${id}/status`;
    const res = await authFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
    }

    async function doApprove() {
    setSubmitting("approve");
    setError(null);
    try {
        await updateStatus(row.id, 1); 
        onStatusChanged?.();           
    } catch (e: any) {
        setError(e?.message || "Approve failed");
    } finally {
        setSubmitting(null);
    }
    }

    async function doReject() {
    setSubmitting("reject");
    setError(null);
    try {
        await updateStatus(row.id, 2); 
        onStatusChanged?.();
    } catch (e: any) {
        setError(e?.message || "Reject failed");
    } finally {
        setSubmitting(null);
    }
    }


  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm"><Eye className="h-4 w-4 mr-2" /> Chi tiết</Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>Onboard - {applicant?.fullName ?? "—"}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin offer</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-slate-500">Tên ứng viên</div>
              <div className="font-medium">{applicant?.fullName ?? "—"}</div>

              <div className="text-slate-500">Email</div>
              <div>{applicant?.email ?? "—"}</div>

              <div className="text-slate-500">Mức lương đề xuất</div>
              <div className="flex items-center gap-2">
                {fmtVnd(row.proposedSalary)} - {salInfo.label}
              </div>

              <div className="text-slate-500">Ngày bắt đầu đi làm</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> {fmtDate(row.proposedStartDate)}
              </div>

              <div className="text-slate-500">Trạng thái</div>
              <div>
                <Badge className={`border ${statusInfo.key != null ? statusColor[statusInfo.key] : "bg-slate-100 text-slate-700 border-slate-200"} font-normal`}>
                  {statusInfo.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Kết quả phỏng vấn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-500">Không có kết quả phỏng vấn.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Lịch sử Offer</CardTitle>
            </CardHeader>
            <CardContent>
              {!row.requestOnboardHistories || row.requestOnboardHistories.length === 0 ? (
                <div className="text-sm text-slate-500">Không có lịch sử offer.</div>
              ) : (
                <div className="space-y-3">
                  {row.requestOnboardHistories.map((h, idx) => {
                    const old = h.oldStatus != null ? coerceStatusLabel(Number(h.oldStatus)) : { key: null, label: "—" };
                    return (
                      <div key={idx} className="grid grid-cols-[120px_1fr] gap-3 text-sm">
                        <div className="text-slate-500">Trạng thái trước: {old.label}</div>
                        <div>
                          <div className="font-medium">Thay đổi bởi {h.changedByUser ?? "—"}</div>
                          {h.note ? <div className="text-slate-600">{h.note}</div> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          {error && <div className="text-sm text-rose-600">{error}</div>}
          <div className="flex items-center gap-2">
            <Button
              onClick={doApprove}
              disabled={submitting !== null}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting === "approve" ? "Đang xác nhận..." : "Xác nhận và gửi mail đến ứng viên"}
            </Button>
            <Button
              onClick={doReject}
              disabled={submitting !== null}
              variant="destructive"
            >
              {submitting === "reject" ? "Đang từ chối..." : "Từ chối"}
            </Button>
          </div>
        </div>        
      </SheetContent>
    </Sheet>
  );
}
