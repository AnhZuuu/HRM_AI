"use client";

import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";
import { OnboardRequestStatus, SalaryTpe, statusColor } from "@/app/utils/enum";
import { fmtDate, fmtVnd, toDateInput, toIsoFromDateInput } from "@/app/utils/helper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { isHR } from "@/lib/auth";
import {
  ClipboardList,
  History,
  Eye,
  PencilLine,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

type ApiResponse<T> = {
  code: number;
  status: boolean;
  message?: string;
  data: T;
};

function coerceStatusLabel(status: number | string): {
  key: number | null;
  label: string;
} {
  if (typeof status === "number")
    return {
      key: status,
      label: OnboardRequestStatus[status] ?? String(status),
    };
  const found = Object.entries(OnboardRequestStatus).find(
    ([, v]) => v.toLowerCase() === status.toLowerCase()
  );
  return { key: found ? Number(found[0]) : null, label: status };
}

function coerceSalaryLabel(t: number | string): {
  key: number | null;
  label: string;
} {
  if (typeof t === "number")
    return { key: t, label: SalaryTpe[t] ?? String(t) };
  const found = Object.entries(SalaryTpe).find(
    ([, v]) => v.toLowerCase() === String(t).toLowerCase()
  );
  return { key: found ? Number(found[0]) : null, label: String(t) };
}

export default function OnboardDetailSheet({
  row,
  onStatusChanged,
}: {
  row: Onboard;
  onStatusChanged?: () => void;
}) {
  const applicant = row.cvApplicantModel;
  const statusInfo = coerceStatusLabel(row.status);
  const salInfo = coerceSalaryLabel(row.salaryType);

  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const [outcomes, setOutcomes] = useState<InterviewOutcome[]>([]);
  const [outcomeError, setOutcomeError] = useState<string | null>(null);
  const [loadingOutcomes, setLoadingOutcomes] = useState(false);
  const isPending = statusInfo.key === 0;
  const [editing, setEditing] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);
  const [offerSalary, setOfferSalary] = useState<string>(String(row.proposedSalary ?? ""));
  const [offerSalaryType, setOfferSalaryType] = useState<string>(
    String(typeof row.salaryType === "number" ? row.salaryType : salInfo.key ?? 0)
  );
  const [offerStartDate, setOfferStartDate] = useState<string>(toDateInput(row.proposedStartDate));

  async function fetchOutcomes() {
    setLoadingOutcomes(true);
    setOutcomeError(null);
    try {
      const url = `${API.CV.APPLICANT}/${row.cvApplicantId}/outcomes`;
      const res = await authFetch(url, { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as ApiResponse<InterviewOutcome>;
      const items: InterviewOutcome[] = Array.isArray(json?.data)
        ? json.data
        : [];
      console.log(items);
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

  const salaryTypeOptions = useMemo(
    () =>
      Object.entries(SalaryTpe)
        .filter(([k]) => !Number.isNaN(Number(k)))
        .map(([k, v]) => ({ value: k, label: String(v) })),
    []
  );

   function openEdit() {
    setOfferSalary(String(row.proposedSalary ?? ""));
    setOfferSalaryType(String(typeof row.salaryType === "number" ? row.salaryType : salInfo.key ?? 0));
    setOfferStartDate(toDateInput(row.proposedStartDate));
    setEditing(true);
  }

  async function saveOffer() {
    const salaryNum = Number(offerSalary);
    if (!Number.isFinite(salaryNum) || salaryNum < 0) {
      toast.error("Mức lương phải là số không âm.");
      return;
    }
    if (!offerSalaryType || Number.isNaN(Number(offerSalaryType))) {
      toast.error("Vui lòng chọn loại lương.");
      return;
    }
    if (!offerStartDate) {
      toast.error("Vui lòng chọn ngày bắt đầu.");
      return;
    }

    setSavingOffer(true);
    try {
      const body = {
        proposedSalary: salaryNum,
        salaryType: Number(offerSalaryType),
        proposedStartDate: offerStartDate,
        status: row.status, 
      };

      const res = await authFetch(`${API.ONBOARD.BASE}/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `HTTP ${res.status}`);
      }

      toast.success("Thông tin offer đã được lưu.");
    
      setEditing(false);
      onStatusChanged?.();
    } catch (e: any) {
      toast.error(e?.message || "Không thể lưu thay đổi.");
    } finally {
      setSavingOffer(false);
    }
  }

  async function updateStatus(
    id: string,
    onboardRequestStatus: number,
    note?: string
  ) {
    const url = `${
      API.ONBOARD.BASE
    }/${id}/status?onboardRequestStatus=${encodeURIComponent(
      String(onboardRequestStatus)
    )}`;

    const res = await authFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note ?? "" }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      toast.error(txt || `HTTP ${res.status}`);
      throw new Error(txt || `HTTP ${res.status}`);
    }
    return res;
  }

  async function doApprove() {
    setSubmitting("approve");
    setError(null);
    try {
      await updateStatus(row.id, 1);
      toast.success("Onboard đã được xác nhận và gửi mail đến ứng viên");
      onStatusChanged?.();
    } catch (e: any) {
      toast.error(e?.message || "Xác nhận thất bại");
    } finally {
      setSubmitting(null);
    }
  }

  async function doReject() {
    setSubmitting("reject");
    setError(null);
    try {
      await updateStatus(row.id, 2);
      toast.success("Onboard đã được từ chối.");
      onStatusChanged?.();
    } catch (e: any) {
      toast.error(e?.message || "Từ chối thất bại.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-2" /> Chi tiết
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-full sm:max-w-xl p-0 overflow-y-auto"
        aria-describedby={undefined}
      >
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle>Onboard - {applicant?.fullName ?? "—"}</SheetTitle>
        </SheetHeader>

        <div className="px-6 pb-6">
          <div className="space-y-6 h-[calc(100dvh-140px)] overflow-y-auto">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Thông tin offer</CardTitle>
                 {isPending && isHR() && !editing && (
                  <div >
                    <Button size="sm" onClick={openEdit}>
                    <PencilLine className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                  </div>
                  
                )}
              </CardHeader>
              {/* <CardContent className="grid grid-cols-2 gap-3 text-sm">
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
                  <Badge
                    className={`border ${
                      statusInfo.key != null
                        ? statusColor[statusInfo.key]
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    } font-normal`}
                  >
                    {statusInfo.label}
                  </Badge>
                </div>
              </CardContent> */}
              {!editing ? (
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
                  <div className="flex items-center gap-2">{fmtDate(row.proposedStartDate)}</div>

                  <div className="text-slate-500">Trạng thái</div>
                  <div>
                    <Badge
                      className={`border ${
                        statusInfo.key != null
                          ? statusColor[statusInfo.key]
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      } font-normal`}
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-slate-500">Tên ứng viên</div>
                  <div className="font-medium">{applicant?.fullName ?? "—"}</div>

                  <div className="text-slate-500">Email</div>
                  <div>{applicant?.email ?? "—"}</div>

                  <div className="text-slate-500">Mức lương đề xuất</div>
                  <div>
                    <Input
                      type="number"
                      min={0}
                      value={offerSalary}
                      onChange={(e) => setOfferSalary(e.target.value)}
                    />
                  </div>

                  <div className="text-slate-500">Loại lương</div>
                  <div>
                    <Select value={offerSalaryType} onValueChange={setOfferSalaryType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn loại lương" />
                      </SelectTrigger>
                      <SelectContent>
                        {salaryTypeOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-slate-500">Ngày bắt đầu đi làm</div>
                  <div>
                    <Input
                      type="date"
                      value={offerStartDate}
                      onChange={(e) => setOfferStartDate(e.target.value)}
                    />
                  </div>

                  <div className="text-slate-500">Trạng thái</div>
                  <div>
                    <Badge
                      className={`border ${
                        statusInfo.key != null
                          ? statusColor[statusInfo.key]
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      } font-normal`}
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardContent>
              )}
               
                {editing && (
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Button size="sm" onClick={saveOffer} disabled={savingOffer}>
                      {savingOffer ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={savingOffer}>
                      Hủy
                    </Button>
                  </div>
                )}

            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" /> Kết quả phỏng vấn
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingOutcomes ? (
                  <div className="text-sm text-muted-foreground">
                    Đang tải kết quả…
                  </div>
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
                          <div className="text-slate-500">
                            Đánh giá của người phỏng vấn{" "}
                          </div>

                          <div className="flex items-center gap-2">
                            <PencilLine className="h-4 w-4" />
                            <p className="mt-1 whitespace-pre-wrap">
                              {o.feedback || "—"}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Chưa có đánh giá.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" /> Lịch sử Offer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!row.requestOnboardHistories ||
                row.requestOnboardHistories.length === 0 ? (
                  <div className="text-sm text-slate-500">
                    Không có lịch sử offer.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {row.requestOnboardHistories.map((h, idx) => {
                      const old =
                        h.oldStatus != null
                          ? coerceStatusLabel(Number(h.oldStatus))
                          : { key: null, label: "—" };
                      return (
                        <div key={idx} className="grid grid-cols-2 gap-3">
                          <div className="text-slate-500">Trạng thái trước: </div>
                          <div>
                            <Badge
                              className={`border ${
                                h.oldStatus != null
                                  ? statusColor[Number(h.oldStatus)]
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              } font-normal`}
                            >
                              {old.label}
                            </Badge>
                          </div>
                          <div>
                            {h.note ? (
                              <div className="text-slate-600">{h.note}</div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            {isPending && isHR() && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={doApprove}
                  disabled={submitting !== null}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {submitting === "approve"
                    ? "Đang xác nhận..."
                    : "Xác nhận và gửi mail đến ứng viên"}
                </Button>
                <Button
                  onClick={doReject}
                  disabled={submitting !== null}
                  variant="destructive"
                >
                  {submitting === "reject" ? "Đang từ chối..." : "Từ chối"}
                </Button>
              </div>
            )}
            {isPending && !isHR() && (
              <div className="text-sm text-rose-600">Onboard đang chờ HR phê duyệt</div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
