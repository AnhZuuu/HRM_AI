"use client";

import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";
import { OnboardRequestStatus, SalaryTpe, statusColor } from "@/app/utils/enum";
import { fmtDate, fmtVnd } from "@/app/utils/helper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Calendar, ClipboardList, History, Eye, PencilLine } from "lucide-react";
import { useEffect, useState } from "react";

type ApiResponse<T> = {
  code: number;
  status: boolean;
  message?: string;
  data: T;
};

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

  const [outcomes, setOutcomes] = useState<InterviewOutcome[]>([]);
  const [outcomeError, setOutcomeError] = useState<string | null>(null);
  const [loadingOutcomes, setLoadingOutcomes] = useState(false);

    async function fetchOutcomes() {
    setLoadingOutcomes(true);
    setOutcomeError(null);
    try {
      const url = `${API.CV.APPLICANT}/${row.cvApplicantId}/outcomes`;
      const res = await authFetch(url, { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as ApiResponse<InterviewOutcome>;
      const items: InterviewOutcome[] = Array.isArray(json?.data) ? json.data : [];
      console.log(items)
      setOutcomes(items);
    } catch (e: any) {
      setOutcomeError(e?.message || "Failed to load outcomes");
      setOutcomes([]);
    } finally {
      setLoadingOutcomes(false);
    }
  }

    useEffect(() => {
    if (outcomes.length === 0 && applicant?.id) {
      void fetchOutcomes();
    }
  }, []);

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
      <SheetContent className="w-full sm:max-w-xl p-0 overflow-y-auto" aria-describedby={undefined}>
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle>Onboard - {applicant?.fullName ?? "—"}</SheetTitle>
        </SheetHeader>

        <div className="px-6 pb-6">
          <div className="space-y-6 h-[calc(100dvh-140px)] overflow-y-auto">
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
                {fmtDate(row.proposedStartDate)}
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
             {loadingOutcomes ? (
                <div className="text-sm text-muted-foreground">Đang tải kết quả…</div>
              ) : outcomeError ? (
                <div className="text-sm text-rose-600">{outcomeError}</div>
              ) : outcomes.length ? (
                <ol className="relative border-s pl-6">
                  {outcomes.map((o, idx) => (
                    <li key={o.id} className="mb-8 ms-4">
                      <span className="absolute -start-2 grid h-4 w-4 place-items-center rounded-full border bg-blue-50 border-blue-200">
                        <span className="h-2 w-2 rounded-[4px] bg-blue-500" />
                      </span>

                      <div className="flex items-center gap-2">
                        <p className="font-medium">{`Vòng ${idx + 1}`}</p>                        
                      </div>

                      <div className="mt-2 space-y-2 text-sm text-muted-foreground bg-gray-100 border-b rounded-2xl shadow-sm p-2">
                        <div className="text-slate-500">Đánh giá của người phỏng vấn </div>
                        
                        <div className="flex items-center gap-2">
                          <PencilLine className="h-4 w-4" />
                          <p className="mt-1 whitespace-pre-wrap">{o.feedback || "—"}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="text-sm text-muted-foreground">Chưa có đánh giá.</div>
              )}
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
        </div>        
      </SheetContent>
    </Sheet>
  );
}
