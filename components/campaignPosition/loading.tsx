"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export default function LoadingDialog({
  open,
  title = "Đang xử lý...",
  subtitle = "Hệ thống đang phân tích CV của bạn. Vui lòng đợi trong giây lát."
}: {
  open: boolean;
  title?: string;
  subtitle?: string;
}) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          {subtitle}
        </div>
      </DialogContent>
    </Dialog>
  );
}
