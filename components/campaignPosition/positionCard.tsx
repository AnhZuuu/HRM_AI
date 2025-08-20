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
import ShowAllDialog, { LiveUploadItem } from "./showAll";
import CvApplicantDialog from "./cvApplicant";

type CvApplicantDraft = {
  fileUrl: string;
  fileAlt: string;
  fullName: string | null;
  email: string | null;
  point: number | null;
  campaignPositionId: string;
  cvApplicantDetailsAddModels: any[];
  originalFile?: File;

  // optional extras from backend
  warning?: string | null;
  evaluationComment?: string | null;
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
  // dialogs + selection
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [listOpen, setListOpen] = React.useState(false);
  const [activePos, setActivePos] = React.useState<CampaignPosition | null>(null);
  const [files, setFiles] = React.useState<FileList | null>(null);

  // live upload result dialog
  const [resultOpen, setResultOpen] = React.useState(false);
  const [liveItems, setLiveItems] = React.useState<LiveUploadItem[]>([]);

  // detail dialog
  const [cvOpen, setCvOpen] = React.useState(false);
  const [cvDraft, setCvDraft] = React.useState<CvApplicantDraft | null>(null);

  // optional: keep but unused if you want to show a global spinner elsewhere
  const [loadingOpen] = React.useState(false);

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

  const pickValue = (arr: any[], key: string) =>
    (arr?.find?.((x: any) => x?.key === key)?.value) ?? null;

  // Build draft for CvApplicantDialog from one item payload
  const buildDraftFromItem = (item: any, campaignPositionId: string): CvApplicantDraft | null => {
    // support both shapes: item.data.data or item.data
    const inner = item?.data?.data ?? item?.data ?? {};
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
      warning: inner?.warning ?? null,
      evaluationComment: inner?.evaluationComment ?? null,
    };
  };

  // Upload one file and update its live item as it progresses
  const uploadOne = async (file: File, index: number, campaignPositionId: string) => {
    try {
      // mark uploading
      setLiveItems(prev => {
        const next = [...prev];
        next[index] = { ...next[index], status: "UPLOADING" };
        return next;
      });

      const fd = new FormData();
      fd.append("campaignPositionId", campaignPositionId);
      fd.append("CampaignPositionId", campaignPositionId);
      fd.append("file", file);

      const url = `${API.CV.PARSE}?campaignPositionId=${encodeURIComponent(campaignPositionId)}`;
      const res = await authFetch(url, { method: "POST", body: fd });

      console.log("Upload response status:", res.status, res.ok);

      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch { /* ignore */ }

      console.log("Upload response JSON:", data);

      if (!res.ok) {
        setLiveItems(prev => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            status: "FAILED",
            httpStatus: res.status,
            ok: false,
            message: data?.message || text || `Upload failed: ${res.status}`,
          };
          return next;
        });
        return;
      }

      // success
      setLiveItems(prev => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          status: "DONE",
          httpStatus: res.status,
          ok: true,
          message: data?.message ?? "OK",
          payload: data,
        };
        return next;
      });
    } catch (err: any) {
      setLiveItems(prev => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          status: "FAILED",
          ok: false,
          message: err?.message || String(err),
        };
        return next;
      });
    }
  };

  // Start live/async uploads for all selected files
  const handleUpload = async () => {
    if (!activePos || !files?.length) return;

    console.log("Uploading CV(s) for campaignPositionId:", activePos.id);

    // seed live items & open the live dialog right away
    const seeded: LiveUploadItem[] = Array.from(files).map((file) => ({
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      originalFile: file,
      status: "UPLOADING",
    }));
    setLiveItems(seeded);
    setResultOpen(true);
    setUploadOpen(false);
    setFiles(null);

    // kick off each upload concurrently
    seeded.forEach((it, idx) => {
      uploadOne(it.originalFile, idx, activePos.id);
    });
  };

  // “Chi tiết” handler from the live dialog
  const handleDetails = (index: number) => {
    const it = liveItems[index];
    if (!it || it.status !== "DONE" || !it.ok || !activePos) return;

    // wrap to match buildDraftFromItem’s expected shape
    const wrapped = {
      fileName: it.fileName,
      fileUrl: it.fileUrl,
      originalFile: it.originalFile,
      status: it.httpStatus ?? 200,
      ok: it.ok,
      message: it.message,
      data: it.payload, // server JSON
    };

    const draft = buildDraftFromItem(wrapped, activePos.id);
    if (!draft) return;
    setCvDraft(draft);
    setCvOpen(true);
  };
  React.useEffect(() => {
    if (liveItems.length === 0) return;
    const allFinished = liveItems.every(i => i.status !== "UPLOADING");
    if (!allFinished) return;

    // Build a summary like your old `items` array
    const items = liveItems.map(it => ({
      fileName: it.fileName,
      fileUrl: it.fileUrl,
      originalFile: it.originalFile,
      status: it.httpStatus ?? 0,
      ok: !!it.ok,
      message: it.message ?? null,
      data: it.payload ?? null,
    }));

    console.log("All uploads done:", items); // <-- add
  }, [liveItems]);

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

      {/* Optional global loading dialog (kept for compatibility) */}
      <LoadingDialog open={loadingOpen} />

      {/* LIVE progress dialog with per-file “Chi tiết” */}
      <ShowAllDialog
        open={resultOpen}
        onOpenChange={setResultOpen}
        result={null}                 // using live mode
        liveItems={liveItems}
        onDetails={handleDetails}
      />

      {/* Detail dialog to confirm & save applicant */}
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
