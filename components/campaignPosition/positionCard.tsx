"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";
import LoadingDialog from "./loading";
import ShowAllDialog from "./showAll";
import CvApplicantDialog from "./cvApplicant";

type UploadResult = {
  status: number;
  ok: boolean;
  message?: string | null;
  data?: any;
};
type CvApplicantDraft = {
  fileUrl: string;                 // from uploaded File (blob URL)
  fileAlt: string;                 // file name
  fullName: string | null;         // parsedData -> key: "full_name"
  email: string | null;            // parsedData -> key: "email"
  point: number | null;            // rating
  campaignPositionId: string;      // activePos.id
  cvApplicantDetailsAddModels: any[]; // full parsedData array
   originalFile?: File;  
};


function getPositionStatus(campaignStatus: string, pos: CampaignPosition) {
  if (campaignStatus === "Kết thúc" || campaignStatus === "Kết thúc hôm nay") {
    return { label: "Đóng", tone: "bg-zinc-100 text-zinc-700" };
  }
  const applied = pos.cvApplicants?.length ?? 0;
  if (applied >= pos.totalSlot) return { label: "Đóng", tone: "bg-red-100 text-red-700" };
  return { label: "Mở", tone: "bg-emerald-100 text-emerald-700" };
}

export default function CampaignPositions(
  { positions, campaignStatus }: { positions: CampaignPosition[]; campaignStatus: string }
) {
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [listOpen, setListOpen] = React.useState(false);
  const [activePos, setActivePos] = React.useState<CampaignPosition | null>(null);
  const [files, setFiles] = React.useState<FileList | null>(null);

  const [loadingOpen, setLoadingOpen] = React.useState(false);
  const [result, setResult] = React.useState<UploadResult | null>(null);
  const [resultOpen, setResultOpen] = React.useState(false);

  const [cvOpen, setCvOpen] = React.useState(false);
  const [cvDraft, setCvDraft] = React.useState<CvApplicantDraft | null>(null);
  const [selectedIdx, setSelectedIdx] = React.useState(0);

  const appliedCount = (p: CampaignPosition) => p.cvApplicants?.length ?? 0;

  const openUpload = (p: CampaignPosition) => {
    console.log("Upload CV for position ID:", p.id);
    setActivePos(p);
    setUploadOpen(true);
  };
  const openList = (p: CampaignPosition) => {
    console.log("View applicants for position ID:", p.id);
    setActivePos(p);
    setListOpen(true);
  };


  const handleUpload = async () => {
    if (!activePos || !files?.length) return;

    setLoadingOpen(true); // <-- show loading
    try {
      console.log("Uploading CV(s) for campaignPositionId:", activePos.id);

      const tasks = Array.from(files).map(async (file) => {
        const fd = new FormData();
        fd.append("campaignPositionId", activePos.id); // keep old behavior
        fd.append("CampaignPositionId", activePos.id); // keep old behavior
        fd.append("file", file);

        const url = `${API.CV.PARSE}?campaignPositionId=${encodeURIComponent(activePos.id)}`;

        const res = await authFetch(url, { method: "POST", body: fd });

        console.log("Upload response status:", res.status, res.ok);
        const text = await res.text();

        let data: any = null;
        try { data = text ? JSON.parse(text) : null; } catch { /* ignore non-JSON */ }

        if (!res.ok) {
          console.error("Upload failed body:", text);
          throw new Error(data?.message || text || `Upload failed: ${res.status}`);
        }


        const fileUrl = URL.createObjectURL(file);


        console.log("Upload response JSON:", data);
        return {
          fileName: file.name,
          fileUrl,             // you already add this
          originalFile: file,
          status: res.status,
          ok: true,
          message: data?.message ?? "OK",
          data,
        };
      });

      // Use allSettled so one failure doesn't cancel others
      const settled = await Promise.allSettled(tasks);

      const items = settled.map((r) =>
        r.status === "fulfilled"
          ? r.value
          : { fileName: "(unknown)", status: 0, ok: false, message: String(r.reason), data: null }
      );

      const okCount = items.filter(i => i.ok).length;
      const failCount = items.length - okCount;

      if (failCount > 0) {
        alert(`Một số tệp thất bại: ${failCount}/${items.length}.`);
      }

      // Summarize for result modal (ShowAllDialog)
      setResult({
        status: okCount === items.length ? 200 : 207, // summary
        ok: okCount === items.length,
        message: `Thành công ${okCount}/${items.length}, thất bại ${failCount}/${items.length}`,
        data: { items },
      });

      console.log("All uploads done:", items);
      setUploadOpen(false);
      setFiles(null);
      setResultOpen(true); // <-- open result modal
    } catch (err) {
      console.error("Upload error:", err);
      alert(String((err as Error)?.message || err)); // <-- failure alert
    } finally {
      setLoadingOpen(false); // <-- hide loading
    }
  };


  const pickValue = (arr: any[], key: string) =>
    (arr?.find?.((x: any) => x?.key === key)?.value) ?? null;

  const buildDraftFromItem = (item: any, campaignPositionId: string): CvApplicantDraft | null => {
    const inner = item?.data?.data ?? {};
    const parsed = Array.isArray(inner?.parsedData) ? inner.parsedData : [];

    return {
      fileUrl: item?.fileUrl ?? "",
      fileAlt: item?.fileName ?? "",
      originalFile: item?.originalFile,  
      fullName: pickValue(parsed, "full_name"),
      email: pickValue(parsed, "email"),
      point: inner?.rating ?? null,
      campaignPositionId,
      cvApplicantDetailsAddModels: parsed,
    };
  };




  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {positions.map((pos, idx) => {
          const applied = appliedCount(pos);
          const left = Math.max(pos.totalSlot - applied, 0);
          const pStatus = getPositionStatus(campaignStatus, pos);

          return (
            <Card key={pos.id} className="rounded-2xl">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <CardTitle className="text-xl font-semibold">
                  {pos.description?.split(".")[0] || `Vị trí #${idx + 1}`}
                </CardTitle>
                <Badge className={pStatus.tone}>{pStatus.label}</Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phòng ban</p>
                  <p className="text-base font-medium">{pos.department ?? "—"}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tổng số lượng</p>
                    <p className="text-base font-medium">{pos.totalSlot}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Đã nộp</p>
                    <p className="text-base font-medium">{applied}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Còn trống</p>
                    <p className={`text-base font-medium ${left === 0 ? "text-red-600" : ""}`}>{left}</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  {pStatus.label === "Đóng" ? (
                    <Button variant="outline" onClick={() => openList(pos)}>
                      Danh sách ứng viên
                    </Button>
                  ) : (
                    <>
                      <Button onClick={() => openUpload(pos)}>Thêm ứng viên</Button>
                      <Button variant="outline" onClick={() => openList(pos)}>Danh sách ứng viên</Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upload CV dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm ứng viên</DialogTitle>
            <DialogDescription>
              Tải lên CV cho vị trí: <span className="font-medium">{activePos?.description?.split(".")[0]}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="cvFiles">File CV</Label>
              <Input
                id="cvFiles"
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFiles(e.target.files)}
              />
              <p className="text-xs text-muted-foreground">
                Hỗ trợ PDF/DOC/DOCX. Có thể chọn nhiều file.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadOpen(false)}>Hủy</Button>
            <Button onClick={handleUpload} disabled={!files || (files?.length ?? 0) === 0}>
              Tải lên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <LoadingDialog open={loadingOpen} />

      <ShowAllDialog
        open={resultOpen}
        onOpenChange={setResultOpen}
        result={result}
        selectedIndex={selectedIdx}
        onSelectIndex={setSelectedIdx}
        onContinue={() => {
          const item = result?.data?.items?.[selectedIdx];
          if (!item || !activePos) return;
          const draft = buildDraftFromItem(item, activePos.id);
          if (!draft) return;
          setCvDraft(draft);
          setCvOpen(true);         // open next modal
        }}
      />

      <CvApplicantDialog
        open={cvOpen}
        onOpenChange={setCvOpen}
        draft={cvDraft}
      />

      {/* Applicant list dialog */}
      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Danh sách ứng viên</DialogTitle>
            <DialogDescription>
              Vị trí: <span className="font-medium">{activePos?.description?.split(".")[0]}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-80 overflow-auto">
            {activePos?.cvApplicants && activePos.cvApplicants.length > 0 ? (
              <ul className="space-y-2">
                {activePos.cvApplicants.map((cv, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md border p-2">
                    <span>{cv.fullName}</span>
                    {/* Example: place “Xem CV” / “Gỡ” buttons here later */}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có ứng viên.</p>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setListOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
