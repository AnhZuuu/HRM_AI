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
  const appliedCount = (p: CampaignPosition) => p.cvApplicants?.length ?? 0;

  const openUpload = (p: CampaignPosition) => { setActivePos(p); setUploadOpen(true); };
  const openList = (p: CampaignPosition) => { setActivePos(p); setListOpen(true); };

  const handleUpload = async () => {
    // TODO: send files to your API (FormData) with activePos.id
    // const fd = new FormData(); [...Array.from(files ?? [])].forEach(f => fd.append("files", f));
    // await fetch(`/api/campaign-positions/${activePos?.id}/upload-cv`, { method: "POST", body: fd });
    setUploadOpen(false);
    setFiles(null);
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
