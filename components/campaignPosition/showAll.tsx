"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type UploadResult = {
    status: number;
    ok: boolean;
    message?: string | null;
    data?: any;
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
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    result: UploadResult | null;
    selectedIndex?: number;
    onSelectIndex?: (i: number) => void;
    onContinue?: () => void;
}) {
    const overallOk = !!result?.ok;
    const overallStatus = result?.status ?? 0;
    const overallMessage = result?.message ?? "";
    const items: any[] | null = Array.isArray(result?.data?.items) ? (result!.data.items as any[]) : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl md:max-w-5xl max-w-[90vw] max-h-[90vh] p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center gap-2">
                        Kết quả tải lên
                        <Badge className={overallOk ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                            {overallOk ? "OK" : "FAILED"}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
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

                    {items ? (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">Kết quả {items.length} tệp</p>
                            <ul className="space-y-3">
                                {items.map((it: any, idx: number) => {
                                    const isSelected = selectedIndex === idx;

                                    const fileOk: boolean = !!it?.ok;
                                    const fileStatus: number = it?.status ?? 0;
                                    const fileName: string = it?.fileName ?? `Tệp #${idx + 1}`;
                                    const fileMsg: string = it?.message ?? "";

                                    const payload = it?.data;
                                    const inner = payload?.data;
                                    const parsed: any[] = Array.isArray(inner?.parsedData) ? inner.parsedData : [];

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

                                            {parsed.length > 0 ? (
                                                <div className="mt-2">
                                                    <p className="text-sm text-muted-foreground">Trích xuất: {parsed.length} mục</p>
                                                    <pre className="max-h-64 overflow-auto rounded-md border p-2 text-xs">
                                                        {JSON.stringify(parsed.slice(0, 10), null, 2)}
                                                    </pre>
                                                    <p className="text-xs text-muted-foreground">Hiển thị tối đa 10 mục để xem nhanh.</p>
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
                </div>

                <DialogFooter className="p-6 pt-3 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button onClick={() => onContinue?.()}>
                        Tiếp tục
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
