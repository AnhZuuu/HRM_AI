import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { authFetch } from "@/app/utils/authFetch";
import { toast } from "react-toastify";
import API from "@/api/api";
import { FancyTextarea } from "./ui/fancyTextarea";

function durationMin(start?: string, end?: string | null) {
  if (!start || !end) return null;
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (isNaN(a) || isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / 60000));
}

export default function InterviewScheduleDetail({ interviewScheduleId }: { interviewScheduleId: string }) {
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getScheduleData = async () => {
    const res = await authFetch(`${API.INTERVIEW.SCHEDULE}/${interviewScheduleId}`);
    const json = await res.json();
    setScheduleData(json.data);
    if (json.data.cvApplicantId) {
      const scheduleRes = await authFetch(`${API.CV.APPLICANT}/${json.data.cvApplicantId}/schedules`);
      const scheduleJson = await scheduleRes.json();
      setSchedules(scheduleJson.data);
    }
  };

  const handleCreateOutcome = async () => {
    setSubmitting(true);
    try {
      const res = await authFetch(`${API.INTERVIEW.OUTCOME}`, {
        method: "POST",
        body: JSON.stringify({
          interviewScheduleId,
          feedback: feedbackText,
        }),
      });
      if (res.ok) {
        toast.success("Đánh giá đã được lưu.");
        await getScheduleData();
      } else {
        toast.error("Không thể lưu đánh giá.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeOutcomeStatus = async (status: number) => {
    const outcomeId = scheduleData?.interviewOutcomeModel?.id;
    if (!outcomeId) return;
    await authFetch(`${API.INTERVIEW.OUTCOME}/${outcomeId}/change-status?interviewOutcomeStatus=${status}`, {
      method: "PUT",
    });
    toast.success("Cập nhật trạng thái thành công");
    await getScheduleData();
  };

  useEffect(() => {
    getScheduleData();
  }, [interviewScheduleId]);

  if (!scheduleData) return <div>Đang tải...</div>;

  const outcome = scheduleData.interviewOutcomeModel;
  const applicant = scheduleData.cvApplicantModel;
  const duration = durationMin(scheduleData.startTime, scheduleData.endTime);

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Left: Applicant info */}
     <Card>
        <CardHeader>
          <CardTitle>Thông tin ứng viên</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Họ tên:</strong> {applicant?.fullName}</div>
          <div><strong>Email:</strong> {applicant?.email}</div>
          <div><strong>Vị trí:</strong> {scheduleData.campaignPositionModel?.description}</div>
          <div>
            <strong>CV:</strong>
            <a href={applicant?.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Xem CV</a>
          </div>
        </CardContent>
      </Card>

      {/* Middle: Interview Details */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết phỏng vấn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Thời gian bắt đầu:</strong> {new Date(scheduleData.startTime).toLocaleString()}</div>
          <div><strong>Thời gian kết thúc:</strong> {new Date(scheduleData.endTime).toLocaleString()}</div>
          <div><strong>Thời lượng:</strong> {duration} phút</div>
          <div><strong>Người phỏng vấn:</strong> {scheduleData.interviewerModel?.[0]?.fullName ?? "--"}</div>
          <div><strong>Phòng ban:</strong> {scheduleData.departmentModel?.departmentName ?? "--"}</div>
          <div><strong>Vị trí:</strong> {scheduleData.campaignPositionModel?.description ?? "--"}</div>
          <div><strong>Ghi chú:</strong> {scheduleData.notes ?? "--"}</div>

          {outcome ? (
            <div className="space-y-2">
              <div><strong>Feedback:</strong> {outcome.feedback}</div>
              <div>
                <strong>Trạng thái:</strong>
                <Badge variant="outline">
                  {outcome.interviewOutcomeStatus === 0 ? "Pending" : outcome.interviewOutcomeStatus === 1 ? "Pass" : "Fail"}
                </Badge>
              </div>
              {outcome.interviewOutcomeStatus === 0 && (
                <div className="space-x-2">
                  <Button onClick={() => handleChangeOutcomeStatus(1)}>Pass</Button>
                  <Button variant="destructive" onClick={() => handleChangeOutcomeStatus(2)}>Fail</Button>
                </div>
              )}
              {outcome.interviewOutcomeStatus === 1 && (
                <Button className="mt-2">Tạo Onboard</Button>
              )}
            </div>
          ) : (
            <div>
              <Label htmlFor="feedback">Feedback</Label>
              <FancyTextarea value={feedbackText} onChange={setFeedbackText} />
              <Button disabled={submitting} onClick={handleCreateOutcome} className="mt-2">Gửi đánh giá</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right: Past schedules */}     
      <Card>
        <CardHeader>
          <CardTitle>Các vòng đã qua</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedules.map((s) => (
            <div key={s.id} className="border p-2 rounded-md">
              <div><strong>Phỏng vấn:</strong> {s.interviewerModel?.[0]?.fullName ?? "--"}</div>
              <div><strong>Thời gian:</strong> {new Date(s.startTime).toLocaleString()}</div>
              <div><strong>Feedback:</strong> {s.interviewOutcomeModel?.feedback ?? "--"}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
