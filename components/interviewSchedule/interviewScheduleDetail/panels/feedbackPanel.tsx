"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";
import { changeOutcomeStatus, OutcomeStatus, outcomeStatusClass, outcomeStatusLabel } from "@/components/interviewOutcome/handleChangeStatusOutcome";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Props } from "../type";
import { fmt, UiInterviewOutcome } from "../../hooks/useInterviewScheduleDetail";
import { FancyTextarea } from "../../ui/fancyTextarea";

export default function FeedbackPanel({
  schedule,
  feedback,
  submitErr,
  submitting,
  submitFeedback,
  setFeedback,
  patchOutcome,
  outcomeToShow,
}: Pick<Props, "schedule" | "feedback" | "submitErr" | "submitting" | "submitFeedback" | "setFeedback" | "patchOutcome"> & {
  outcomeToShow: UiInterviewOutcome | null;
}) {
  const router = useRouter();
  const [selectedOutcomeStatus, setSelectedOutcomeStatus] = useState<OutcomeStatus | null>(null);
  const [savingOutcomeStatus, setSavingOutcomeStatus] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);

  function openEdit() {
    setEditText(outcomeToShow?.feedback ?? "");
    setEditErr(null);
    setEditing(true);
  }

  async function submitEdit() {
    if (!outcomeToShow) return;
    setSavingEdit(true);
    setEditErr(null);
    try {
      const res = await authFetch(`${API.INTERVIEW.OUTCOME}/${outcomeToShow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewScheduleId: outcomeToShow.interviewScheduleId,
          feedback: editText.trim(),
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        toast.error(txt);
        throw new Error(txt || `HTTP ${res.status}`);
      }

      patchOutcome(outcomeToShow.id, { feedback: editText.trim() });
      setEditing(false);
      toast.success("Feedback đã được cập nhật.");      
    } catch (e: any) {
      setEditErr(e?.message || "Update failed");
    } finally {
      setSavingEdit(false);
    }
  }

  useEffect(() => {
    const s = (outcomeToShow as any)?.status;
    if (s === 0 || s === 1 || s === 2) setSelectedOutcomeStatus(s as OutcomeStatus);
  }, [outcomeToShow]);

  return (
    <div className="mt-6">
      <Card className="rounded-xl border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            {outcomeToShow ? "Đánh giá của người phỏng vấn" : "Đánh giá ứng viên"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {outcomeToShow ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Gửi lúc: {fmt(outcomeToShow?.createdAt ?? undefined)}</div>

              {editing ? (
                <>
                  <FancyTextarea value={editText} onChange={setEditText} placeholder="Chỉnh sửa đánh giá cuộc phỏng vấn..." maxLength={1000} />
                  {editErr && <div className="text-sm text-rose-600">{editErr}</div>}
                  <div className="flex items-center justify-end gap-3">
                    <Button variant="secondary" type="button" onClick={() => setEditing(false)} disabled={savingEdit}>
                      Hủy
                    </Button>
                    <Button type="button" onClick={submitEdit} disabled={savingEdit || editText.trim() === (outcomeToShow?.feedback ?? "").trim()}>
                      {savingEdit ? "Đang lưu…" : "Lưu đánh giá"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl border bg-muted/40 p-3 text-sm whitespace-pre-wrap">{outcomeToShow?.feedback || "—"}</div>

                  {selectedOutcomeStatus != null ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Trạng thái outcome:</span>
                      <Badge className={`border ${outcomeStatusClass(selectedOutcomeStatus)} font-normal`}>
                        {outcomeStatusLabel(selectedOutcomeStatus)}
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-3">
                      <Select
                        value={selectedOutcomeStatus != null ? String(selectedOutcomeStatus) : ""}
                        onValueChange={async (v) => {
                          const next = Number(v) as OutcomeStatus;
                          setSavingOutcomeStatus(true);
                          try {
                            await changeOutcomeStatus(outcomeToShow!.id, next);
                            setSelectedOutcomeStatus(next);
                            toast.success(`Outcome -> ${outcomeStatusLabel(next)}`);
                          } finally {
                            setSavingOutcomeStatus(false);
                          }
                        }}
                        disabled={savingOutcomeStatus}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Pass</SelectItem>
                          <SelectItem value="2">Fail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button variant="outline" type="button" onClick={openEdit}>
                      Chỉnh sửa đánh giá
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <FancyTextarea value={feedback} onChange={setFeedback} placeholder="Viết đánh giá về cuộc phỏng vấn..." maxLength={1000} />
              <div className="flex items-center justify-between gap-3">
                {submitErr ? <div className="text-sm text-rose-600">{submitErr}</div> : <span />}
                <div className="flex items-center gap-3">
                  <Button variant="secondary" onClick={() => setFeedback("")} type="button">
                    Làm mới
                  </Button>
                  <Button onClick={submitFeedback} type="button" disabled={submitting || !feedback.trim()} className="gap-2">
                    {submitting ? "Đang gửi…" : "Nộp đánh giá"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center mt-4">
        <Button
          type="button"
          disabled={!outcomeToShow?.id || !schedule?.cvApplicantModel?.id}
          onClick={() => {
            const outcomeId = outcomeToShow!.id;
            // NOTE: bạn đang dùng fullName làm applicantId theo code gốc — giữ nguyên logic
            const applicantId = schedule!.cvApplicantModel!.fullName;
            router.push(`/dashboard/onboards/new?outcomeId=${outcomeId}&applicantId=${applicantId}`);
          }}
        >
          Tạo onboard
        </Button>
      </div>
    </div>
  );
}
