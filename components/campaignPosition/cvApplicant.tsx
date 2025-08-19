"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";
import { Badge } from "@/components/ui/badge";

type CvApplicantDraft = {
    fileUrl: string;
    fileAlt: string;
    fullName: string | null;
    email: string | null;
    point: number | null;
    campaignPositionId: string;
    cvApplicantDetailsAddModels: any[];
    originalFile?: File;

    // optional from backend response
    warning?: string | null;
    evaluationComment?: string | null;
};

export default function CvApplicantDialog({
    open,
    onOpenChange,
    draft
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    draft: CvApplicantDraft | null;
}) {
    const [saving, setSaving] = useState(false);
    const safeDraft = draft ?? { cvApplicantDetailsAddModels: [] };

    // -------- NEW: compute skills from parsedData --------
    const skillRows = useMemo(
        () =>
            (draft?.cvApplicantDetailsAddModels ?? []).filter(
                (d: any) => String(d.type ?? d.Type) === "skill"
            ),
        [draft?.cvApplicantDetailsAddModels]
    );

    const skills = useMemo(() => {
        const set = new Set<string>();
        for (const r of skillRows) {
            const raw = String(r.value ?? r.Value ?? "");
            if (!raw) continue;
            raw
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .forEach((s) => set.add(s));
        }
        return Array.from(set);
    }, [skillRows]);

    if (!draft) return null;
    // -----------------------------------------------------
    

    const saveApplicant = async () => {
        if (!draft) return;
        setSaving(true);
        try {
            const fd = new FormData();

            // FileUrl (binary)
            if (draft.originalFile) {
                fd.append("FileUrl", draft.originalFile, draft.fileAlt || draft.originalFile.name || "cv.bin");
            } else if (draft.fileUrl) {
                const blob = await fetch(draft.fileUrl).then(r => r.blob());
                fd.append("FileUrl", new File([blob], draft.fileAlt || "cv.bin", { type: blob.type || "application/octet-stream" }));
            } else {
                throw new Error("Thiếu tệp đính kèm (FileUrl).");
            }

            // Simple fields
            fd.append("FileAlt", draft.fileAlt ?? "");
            fd.append("FullName", draft.fullName ?? "");
            fd.append("Email", draft.email ?? "");
            fd.append("Point", draft.point != null ? String(draft.point) : "");
            fd.append("CampaignPositionId", draft.campaignPositionId);

            // List fields (indexed)
            const details = draft.cvApplicantDetailsAddModels ?? [];
            details.forEach((d: any, i: number) => {
                fd.append(`CVApplicantDetailsAddModels[${i}].Type`, String(d.type ?? d.Type ?? ""));
                fd.append(`CVApplicantDetailsAddModels[${i}].Key`, String(d.key ?? d.Key ?? ""));
                fd.append(`CVApplicantDetailsAddModels[${i}].Value`, String(d.value ?? d.Value ?? ""));
                fd.append(`CVApplicantDetailsAddModels[${i}].GroupIndex`, String(d.groupIndex ?? d.GroupIndex ?? 0));
            });

            const res = await authFetch(`${API.CV.APPLICANT}`, { method: "POST", body: fd });

            const text = await res.text();
            let data: any = null; try { data = text ? JSON.parse(text) : null; } catch { /* ignore */ }
            if (!res.ok) throw new Error(data?.message || text || `Tạo ứng viên thất bại: ${res.status}`);

            onOpenChange(false);
        } catch (err: any) {
            console.error("Save CV applicant error:", err);
            alert(err?.message || String(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="
          w-[95vw] max-w-[95vw] sm:max-w-3xl md:max-w-5xl
          h-[85dvh] p-0 overflow-hidden
          grid grid-rows-[auto_minmax(0,1fr)_auto]
        "
            >
                {/* Header */}
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Xác nhận tạo ứng viên</DialogTitle>

                    {/* Warning (optional) */}
                    {draft.warning ? (
                        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 text-amber-800 px-3 py-2">
                            <p className="text-sm font-medium">Cảnh báo</p>
                            <p className="text-sm whitespace-pre-line">{draft.warning}</p>
                        </div>
                    ) : null}

                    {/* Evaluation comment (optional) */}
                    {/* {draft.evaluationComment ? (
                        <div className="mt-3 rounded-md border border-blue-300 bg-blue-50 text-blue-900 px-3 py-2">
                            <p className="text-sm font-medium">Nhận xét đánh giá</p>
                            <p className="text-sm whitespace-pre-line">{draft.evaluationComment}</p>
                        </div>
                    ) : null} */}
                </DialogHeader>

                {/* Body */}
                <div className="min-h-0 overflow-y-auto overflow-x-hidden p-6 space-y-6 w-full max-w-full">
                    {draft.fileUrl ? (
                        <div className="rounded-md border p-4 w-full max-w-full">
                            <p className="text-sm text-muted-foreground mb-2">Tệp đính kèm</p>
                            <a
                                href={draft.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 underline break-all"
                                title={draft.fileAlt || "Xem tệp"}
                            >
                                {draft.fileAlt || "Xem tệp"}
                            </a>
                        </div>
                    ) : null}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-full">
                        <div className="rounded-md border p-4 min-w-0">
                            <p className="text-xs text-muted-foreground">Họ tên</p>
                            <p className="text-sm font-medium break-words">{draft.fullName || "—"}</p>
                        </div>
                        <div className="rounded-md border p-4 min-w-0">
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm font-medium break-all">{draft.email || "—"}</p>
                        </div>
                        <div className="rounded-md border p-4 min-w-0">
                            <p className="text-xs text-muted-foreground">Điểm</p>
                            <p className="text-sm font-medium">{draft.point ?? "—"}</p>
                        </div>
                        <div className="rounded-md border p-4 min-w-0">
                            <p className="text-xs text-muted-foreground">CampaignPositionId</p>
                            <p className="text-sm font-medium break-all">{draft.campaignPositionId}</p>
                        </div>
                    </div>

                    {/* NEW: Skills section */}
                    <div className="rounded-lg border w-full max-w-full overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3">
                            <p className="text-sm text-muted-foreground">Kỹ năng (skills) — {skills.length}</p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigator.clipboard.writeText(JSON.stringify(skills, null, 2))}
                                >
                                    Copy list
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        const blob = new Blob([JSON.stringify(skills, null, 2)], { type: "application/json" });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = "skills.json";
                                        a.click();
                                        URL.revokeObjectURL(url);
                                    }}
                                >
                                    Tải JSON
                                </Button>
                            </div>
                        </div>
                        <div className="px-4 pb-4">
                            {skills.length === 0 ? (
                                <p className="text-sm text-gray-500">No skills listed.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((s) => (
                                        <Badge key={s} variant="secondary" className="px-2 py-1">
                                            {s}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    {draft.evaluationComment ? (
                        <div className="mt-3 rounded-md border border-blue-300 bg-blue-50 text-blue-900 px-3 py-2">
                            <p className="text-sm font-medium">Nhận xét đánh giá</p>
                            <p className="text-sm whitespace-pre-line">{draft.evaluationComment}</p>
                        </div>
                    ) : null}
                    {/* Original parsedData viewer (kept) */}
                    {/* <div className="rounded-lg border w-full max-w-full overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3">
                            <p className="text-sm text-muted-foreground">
                                Chi tiết trích xuất (parsedData) — {draft.cvApplicantDetailsAddModels?.length ?? 0} mục
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        navigator.clipboard.writeText(
                                            JSON.stringify(draft.cvApplicantDetailsAddModels, null, 2)
                                        )
                                    }
                                >
                                    Copy JSON
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        const blob = new Blob(
                                            [JSON.stringify(draft.cvApplicantDetailsAddModels, null, 2)],
                                            { type: "application/json" }
                                        );
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = "parsedData.json";
                                        a.click();
                                        URL.revokeObjectURL(url);
                                    }}
                                >
                                    Tải JSON
                                </Button>
                            </div>
                        </div>
                        <pre className="w-full max-w-full min-w-0 max-h-[55vh] overflow-auto px-4 pb-4 text-xs whitespace-pre-wrap break-words">
                            {JSON.stringify((draft.cvApplicantDetailsAddModels?.slice?.(0, 100) ?? []), null, 2)}
                        </pre>
                    </div> */}
                </div>

                {/* Footer */}
                <DialogFooter className="p-6 pt-3 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button onClick={saveApplicant} disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
