import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authFetch } from "@/app/utils/authFetch";
import { toast } from "react-toastify";
import API from "@/api/api";
import { FancyTextarea } from "./ui/fancyTextarea";
import { ArrowLeft, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { formatDate } from "@/app/utils/helper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import OverviewPanel from "./interviewScheduleDetail/sections/overviewPanel";
import PanelDetails from "./interviewScheduleDetail/panels/panelDetails";
import InfoRow from "./ui/infoRow";
import { OUTCOME_STATUS } from "@/app/utils/enum";
import RightTimeline from "./interviewScheduleDetail/sections/rightTimeline";
import { isHR } from "@/lib/auth";

function durationMin(start?: string, end?: string | null) {
  if (!start || !end) return null;
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (isNaN(a) || isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / 60000));
}

export default function InterviewScheduleDetail({ interviewScheduleId }: { interviewScheduleId: string }) {
  const [hasCompletedAllStages, setHasCompletedAllStages] = useState<boolean | null>(null);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const getScheduleData = async () => {
    const res = await authFetch(`${API.INTERVIEW.SCHEDULE}/${interviewScheduleId}`);
    const json = await res.json();
    setScheduleData(json.data);
    if (json.data.cvApplicantId) {
      const scheduleRes = await authFetch(`${API.CV.APPLICANT}/${json.data.cvApplicantId}/schedules`);
      const scheduleJson = await scheduleRes.json();
      setSchedules(scheduleJson.data);

      const stageCheckRes = await authFetch(`${API.INTERVIEW.STAGE}/${json.data.cvApplicantId}/next-stages`);
      const stageCheckJson = await stageCheckRes.json();
      const { status, message, data } = stageCheckJson;
      setHasCompletedAllStages(status === true && message === "Applicant has completed all interview stages." && data === null);
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
    <div className="min-h-[90vh] w-full bg-muted/30 p-4 md:p-8">
      <div className="flex items-end mb-2">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
      </div>
      {/* Left: Applicant info */}
      <div className="mx-auto max-w-6xl rounded-2xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr_320px]">
          <Card>
            <div className="flex flex-col items-center text-center">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Thông tin ứng viên</CardTitle>
              </CardHeader>
              <div className="relative h-24 w-24 rounded-full bg-gradient-to-b from-blue-100 to-blue-200 overflow-hidden">
                <Avatar className="h-24 w-24 rounded-2xl ring-1 ring-border">
                  <AvatarFallback className="text-2xl font-semibold">
                    {/* {initials(applicant.fullName)} */}
                  </AvatarFallback>
                </Avatar>
               </div>
              <CardContent className="space-y-2">
                  <h3 className="mt-4 text-lg font-semibold leading-tight">
                    {applicant?.fullName ?? "—"}
                  </h3> 
                  <p className="mt-1 max-w-[220px] text-sm leading-relaxed text-muted-foreground">
                    Ứng tuyển vào vị trí {scheduleData.campaignPositionModel?.description}
                  </p>
              </CardContent>              
            </div>
            <div className="mr-6 ml-6 mb-4 h-px bg-border" />

              <CardContent className="space-y-2 text-sm mb-2">
                <a className="text-muted-foreground">Email: </a>
                <a className="font-medium">{applicant?.email || "—"}</a>
                <a
                  className="flex w-full items-center gap-2 text-left text-sm text-primary underline-offset-4 hover:underline"
                  href={applicant?.fileUrl}
                >
                  <FileText className="h-4 w-4" /> CV đính kèm
                </a>
            </CardContent>
          </Card>

          {/* Middle: Interview Details */}
          <Card>
            <CardHeader>              
              <CardTitle className="text-lg font-semibold">Thông tin cuộc phỏng vấn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Tabs defaultValue="overview" className="w-full">
                <div className="border-b">
                  <TabsList className="h-auto gap-6 bg-transparent p-0">
                    <TabsTrigger value="overview" className="rounded-none bg-transparent px-0 pb-3 text-sm font-medium data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                      Cơ bản
                    </TabsTrigger>
                    <TabsTrigger value="panel" className="rounded-none bg-transparent px-0 pb-3 text-sm font-medium data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                      Chi tiết
                    </TabsTrigger>
                    <TabsTrigger value="feedback" className="rounded-none bg-transparent px-0 pb-3 text-sm font-medium data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                      Đánh giá
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="overview">
                  <OverviewPanel schedule={scheduleData} durationMin={duration ?? 0} />
                </TabsContent>
                <TabsContent value="panel">            
                  <PanelDetails schedule={scheduleData} />                  
                </TabsContent>
                <TabsContent value="feedback">
                  <div className="mt-6">
                    <Card className="rounded-xl border bg-card shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">
                          {outcome ? "Đánh giá của người phỏng vấn" : "Đánh giá ứng viên"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {outcome ? (
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Gửi lúc: {formatDate(outcome?.creationDate ?? undefined)}</div>
                            
                            <div className="rounded-xl border bg-muted/40 p-3 text-sm whitespace-pre-wrap">{outcome.feedback}</div>

                            <div className="mt-2 rounded-xl border pl-3">
                              <InfoRow label="Phê duyệt" value={
                                <Badge className={OUTCOME_STATUS[outcome.interviewOutcomeStatus ?? 0].className}>
                                  {outcome.interviewOutcomeStatus === 0 ? "Pending" : outcome.interviewOutcomeStatus === 1 ? "Pass" : "Fail"}
                                  
                                </Badge>
                              }/>        
                              {outcome.interviewOutcomeStatus === 2 && (
                                    <span className="text-sm text-muted-foreground"> - Đã gửi mail thông báo rớt phỏng vấn đến cho ứng viên</span>
                                  )}                      
                            </div>
                            {outcome.interviewOutcomeStatus === 0 && (
                              <div className="space-x-2 flex flex-row justify-center">
                                <Button className="bg-green-500" onClick={() => handleChangeOutcomeStatus(1)}>Pass</Button>
                                <Button variant="destructive" onClick={() => handleChangeOutcomeStatus(2)}>Fail</Button>
                              </div>
                            )}
                            {outcome.interviewOutcomeStatus === 1 && hasCompletedAllStages === true && isHR() && (
                              <div className="space-x-2 flex flex-row justify-center">
                                <Button 
                                  className="mt-2"
                                  type="button"
                                  disabled={!outcome?.id || !scheduleData?.cvApplicantId}
                                  onClick={() => {
                                    const outcomeId = outcome?.id;
                                    const applicantId = applicant?.fullName;
                                    router.push(`/dashboard/onboards/new?outcomeId=${outcomeId}&applicantId=${applicantId}`);
                                }}>Tạo Onboard</Button>
                              </div>  
                            )}
                            {outcome.interviewOutcomeStatus === 1 && hasCompletedAllStages === false && (
                              <div className="space-x-2 flex flex-row justify-center">
                              <Button className="mt-2" variant="outline" onClick={() => router.push(`/dashboard/schedules/new`)}>Tạo lịch phỏng vấn tiếp theo</Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <Label htmlFor="feedback"></Label>
                            <FancyTextarea value={feedbackText} onChange={setFeedbackText} maxLength={1000}/>
                            <Button disabled={submitting} onClick={handleCreateOutcome} className="mt-2">Gửi đánh giá</Button>
                          </div>
                        )}                        
                      </CardContent>
                    </Card>
                  </div>
                 
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Right: Past schedules */}     
          <Card>
              <RightTimeline schedules={schedules} />
          </Card>
        </div>
      </div>
     
    </div>
  );
}
