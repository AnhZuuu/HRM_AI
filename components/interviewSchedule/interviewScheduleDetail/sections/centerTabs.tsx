"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Props } from "../type";
import { UiInterviewOutcome } from "../../hooks/useInterviewScheduleDetail";
import OverviewPanel from "./overviewPanel";
import PanelDetails from "../panels/panelDetails";
import FeedbackPanel from "../panels/feedbackPanel";

export default function CenterTabs({
  schedule,
  durationMin,
  loading,
  loadErr,
  feedback,
  submitErr,
  submitting,
  submitFeedback,
  setFeedback,
  patchOutcome,
  outcomeToShow,
}: Pick<
  Props,
  | "schedule"
  | "durationMin"
  | "loading"
  | "loadErr"
  | "feedback"
  | "submitErr"
  | "submitting"
  | "submitFeedback"
  | "setFeedback"
  | "patchOutcome"
> & { outcomeToShow: UiInterviewOutcome | null }) {
  if (loading) return <div className="text-sm text-muted-foreground">Đang tải dữ liệu…</div>;
  if (loadErr) return <div className="text-sm text-rose-600">{loadErr}</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 text-lg font-semibold">Thông tin cuộc phỏng vấn</div>

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
          <OverviewPanel schedule={schedule} durationMin={durationMin} />
        </TabsContent>
        <TabsContent value="panel">
          <PanelDetails schedule={schedule} />
        </TabsContent>
        <TabsContent value="feedback">
          <FeedbackPanel
            schedule={schedule}
            feedback={feedback}
            submitErr={submitErr}
            submitting={submitting}
            submitFeedback={submitFeedback}
            setFeedback={setFeedback}
            patchOutcome={patchOutcome}
            outcomeToShow={outcomeToShow}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
