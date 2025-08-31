"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

type UploadResult = {
    status: number;
    ok: boolean;
    message?: string | null;
    data?: any;
};

export type LiveUploadItem = {
    fileName: string;
    fileUrl: string;
    originalFile: File;
    status: "UPLOADING" | "DONE" | "FAILED";
    httpStatus?: number;
    ok?: boolean;
    message?: string | null;
    payload?: any; // server JSON for that file
};

function SingleFileFallback({ result }: { result: UploadResult | null }) {


    const inner = result?.data?.data;
    const parsed: any[] = Array.isArray(inner?.parsedData) ? inner.parsedData : [];
    if (!parsed.length) return null;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Trích xuất: {parsed.length} mục</Badge>
                {typeof inner?.rating === "number" && (
                    <Badge className="bg-emerald-100 text-emerald-700">Điểm: {inner.rating}/100</Badge>
                )}
                {typeof inner?.similarityScore === "number" && (
                    <Badge className="bg-blue-100 text-blue-700">Similarity: {inner.similarityScore}</Badge>
                )}
            </div>

            {inner?.evaluationComment && (
                <div className="rounded-md border p-3 text-sm">
                    <p className="mb-1 text-muted-foreground">Đánh giá</p>
                    <p>{inner.evaluationComment}</p>
                </div>
            )}

            <div className="rounded-lg border">
                <div className="flex items-center justify-between px-3 py-2">
                    <p className="text-sm text-muted-foreground">Xem nhanh parsedData (tối đa 50 mục)</p>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(JSON.stringify(parsed, null, 2))}
                        >
                            Copy JSON
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => {
                                const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: "application/json" });
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

                <pre className="h-[60vh] max-h-[60vh] overflow-auto px-3 pb-3 text-xs">
                    {JSON.stringify(parsed.slice(0, 50), null, 2)}
                </pre>
                <p className="px-3 pb-3 text-xs text-muted-foreground">Hiển thị tối đa 50 mục để xem nhanh.</p>
            </div>
        </div>
    );
}

export default function ShowAllDialog({
    open, onOpenChange, result,
    selectedIndex = 0,
    onSelectIndex,
    onContinue,
    // NEW: live mode props
    liveItems,
    onDetails,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    result: UploadResult | null;
    selectedIndex?: number;
    onSelectIndex?: (i: number) => void;
    onContinue?: () => void;

    // NEW: pass these to enable live/async list
    liveItems?: LiveUploadItem[];
    onDetails?: (index: number) => void;
}) {
    const isLive = Array.isArray(liveItems) && liveItems.length > 0;

    // Old summary (kept for backward compatibility)
    const overallOk = !!result?.ok;
    const overallStatus = result?.status ?? 0;
    const overallMessage = result?.message ?? "";
    const itemsFromResult: any[] | null = Array.isArray(result?.data?.items) ? (result!.data.items as any[]) : null;
    const total = liveItems!.length;
    const uploadingCount = liveItems!.filter(i => i.status === "UPLOADING").length;
    const doneCount = liveItems!.filter(i => i.status === "DONE").length;
    const failedCount = liveItems!.filter(i => i.status === "FAILED").length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl md:max-w-5xl max-w-[90vw] max-h-[90vh] p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center gap-2">
                        Kết quả tải lên
                        {!isLive ? (
                            <Badge className={overallOk ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                                {overallOk ? "OK" : "FAILED"}
                            </Badge>
                        ) : null}
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
                    {/* LIVE MODE */}
                    {isLive ? (
                        <div className="space-y-3">
                            {uploadingCount > 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Đang xử lý {uploadingCount}/{total} tệp…
                                </p>
                            ) : failedCount === 0 ? (
                                <p className="text-sm text-emerald-700">Hoàn tất {total}/{total} tệp.</p>
                            ) : (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">Hoàn tất.</span>
                                    <Badge className="bg-emerald-100 text-emerald-700">DONE: {doneCount}</Badge>
                                    <Badge className="bg-red-100 text-red-700">FAILED: {failedCount}</Badge>
                                </div>
                            )}
                            <ul className="space-y-3">
                                {liveItems!.map((it, idx) => {
                                    const isDone = it.status === "DONE";
                                    const isFailed = it.status === "FAILED";
                                    const badgeClass =
                                        it.status === "UPLOADING"
                                            ? "bg-amber-100 text-amber-700"
                                            : isFailed
                                                ? "bg-red-100 text-red-700"
                                                : "bg-emerald-100 text-emerald-700";
                                    const badgeText =
                                        it.status === "UPLOADING" ? "LOADING" : isFailed ? "FAILED" : "DONE";
                                    const badgeNode =
                                        it.status === "UPLOADING" ? (
                                            <span className="inline-flex items-center gap-1 text-blue-600">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Đang xử lý</span>
                                            </span>
                                        ) : isFailed ? (
                                            <span className="inline-flex items-center gap-1 text-red-600">
                                                <XCircle className="h-4 w-4" />
                                                <span>Thất bại</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-green-600">
                                                <CheckCircle className="h-4 w-4" />
                                                <span>Hoàn thành</span>
                                            </span>
                                        );


                                    // peek common fields when done
                                    const inner = it.payload?.data ?? it.payload?.Data ?? it.payload ?? {};
                                    const rating = inner?.rating ?? null;
                                    const sim = inner?.similarityScore ?? null;

                                    return (
                                        <li key={idx} className="rounded-md border p-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">{it.fileName}</p>
                                                    <br />
                                                    {isDone && (rating !== null || sim !== null) ? (
                                                        <div className="mt-1 flex gap-2 text-xs">
                                                            {rating !== null && (
                                                                <Badge variant="outline" className="rounded-md ">Điểm: {rating}/100</Badge>
                                                            )}
                                                            {sim !== null && (
                                                                <Badge variant="outline" className="rounded-md ">Độ tương đồng: {sim}</Badge>
                                                            )}
                                                        </div>
                                                    ) : null}
                                                    {it.message ? <p className="mt-1 text-base">{it.message}</p> : null}
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Badge variant="secondary">{badgeNode}</Badge>

                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={!isDone || !it.ok}
                                                        onClick={() => onDetails?.(idx)}
                                                    >
                                                        Chi tiết
                                                    </Button>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ) : (
                        // ORIGINAL (non-live) PATH
                        <>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">HTTP status (tổng hợp)</span>
                                <span className="text-sm font-medium">{overallStatus}</span>
                            </div>

                            {overallMessage ? (
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Tóm tắt</p>
                                    <p className="text-sm font-medium">{overallMessage}</p>
                                </div>
                            ) : null}

                            {itemsFromResult ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-muted-foreground">Kết quả {itemsFromResult.length} tệp</p>
                                    <ul className="space-y-3">
                                        {itemsFromResult.map((it: any, idx: number) => {
                                            const isSelected = selectedIndex === idx;
                                            const fileOk: boolean = !!it?.ok;
                                            const fileStatus: number = it?.status ?? 0;
                                            const fileName: string = it?.fileName ?? `Tệp #${idx + 1}`;
                                            const fileMsg: string = it?.message ?? "";

                                            const payload = it?.data;
                                            const inner = payload?.data;
                                            const rating = inner?.rating ?? null;
                                            const sim = inner?.similarityScore ?? null;
                                            const evaluation = inner?.evaluationComment ?? null;

                                            return (
                                                <li
                                                    key={idx}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => onSelectIndex?.(idx)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") onSelectIndex?.(idx);
                                                    }}
                                                    className={[
                                                        "rounded-md border p-3 cursor-pointer transition",
                                                        "hover:bg-muted/40 focus-visible:outline-none",
                                                        "focus-visible:ring-2 focus-visible:ring-blue-500",
                                                        isSelected ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/50" : "",
                                                    ].join(" ")}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium">{fileName}</p>
                                                            <p className="text-xs text-muted-foreground">HTTP {fileStatus}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {isSelected && (
                                                                <Badge variant="outline" className="border-blue-500 text-blue-600">
                                                                    Đang chọn
                                                                </Badge>
                                                            )}
                                                            <Badge className={fileOk ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                                                                {fileOk ? "OK" : "FAILED"}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    {fileMsg ? <p className="mt-2 text-sm">{fileMsg}</p> : null}

                                                    {(rating !== null || sim !== null || evaluation) ? (
                                                        <div className="mt-2 grid gap-2 rounded-md border p-2">
                                                            {rating !== null && (
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-muted-foreground">Điểm (rating)</span>
                                                                    <span className="font-medium">{rating}/100</span>
                                                                </div>
                                                            )}
                                                            {sim !== null && (
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-muted-foreground">Similarity</span>
                                                                    <span className="font-medium">{sim}</span>
                                                                </div>
                                                            )}
                                                            {evaluation && (
                                                                <div>
                                                                    <p className="text-sm text-muted-foreground">Đánh giá</p>
                                                                    <p className="text-sm">{evaluation}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ) : (
                                <SingleFileFallback result={result} />
                            )}
                        </>
                    )}
                </div>

                <DialogFooter className="p-6 pt-3 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    {/* In live mode, each row has its own "Chi tiết" button, so keep this for legacy path only */}
                    {!isLive ? (
                        <Button onClick={() => onContinue?.()}>
                            Tiếp tục
                        </Button>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
