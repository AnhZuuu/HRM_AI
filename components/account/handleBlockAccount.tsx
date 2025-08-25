"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";

export type TargetAccount = {
  id: string;
  username: string;
  isDeleted: boolean;
};

type ApiConfig = {
  /** Build URL từ id và trạng thái kế tiếp */
  url: (id: string, nextIsDeleted: boolean) => string;
  /** Mặc định: "PATCH" */
  method?: "PUT" | "PATCH" | "POST";
  /** Body gửi lên; nếu không truyền sẽ không gửi body */
  makeBody?: (id: string, nextIsDeleted: boolean) => any;
  /** Headers bổ sung; mặc định có Content-Type JSON khi có body */
  headers?: Record<string, string>;
};

type ConfirmBlockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: TargetAccount | null;

  /**
   * Tuỳ chọn: cấu hình API. Nếu KHÔNG truyền => sẽ mock (delay 500ms)
   * để bạn test UI trước khi có API thật.
   */
  apiConfig?: ApiConfig;

  /**
   * Tuỳ chọn: callback sau khi thành công (để parent refresh list).
   * Nhận về nextIsDeleted mới.
   */
  onCompleted?: (nextIsDeleted: boolean) => void;
};

export default function ConfirmBlockDialog({
  open,
  onOpenChange,
  target,
  apiConfig,
  onCompleted,
}: ConfirmBlockDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const isUnblock = !!target?.isDeleted;
  const title = isUnblock ? "Mở khóa tài khoản?" : "Khóa tài khoản?";
  const actionLabel = isUnblock ? "Mở khóa" : "Khóa";

  async function handleConfirm() {
    if (!target) return;
    const next = !target.isDeleted;

    try {
      setLoading(true);

      if (apiConfig) {
        const url = apiConfig.url(target.id, next);
        const body = apiConfig.makeBody?.(target.id, next);
        const hasBody = typeof body !== "undefined";

        const res = await authFetch(url, {
          method: apiConfig.method ?? "PATCH",
          headers: hasBody
            ? { "Content-Type": "application/json", ...(apiConfig.headers ?? {}) }
            : apiConfig.headers,
          body: hasBody ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
          let msg = `Thao tác thất bại (HTTP ${res.status}).`;
          try {
            const p = await res.json();
            msg = p?.message ?? p?.detail ?? msg;
          } catch {}
          throw new Error(msg);
        }
      } else {
        // Chưa có API -> mock để test luồng UI
        await new Promise((r) => setTimeout(r, 500));
        console.log("[ConfirmBlockDialog] MOCK toggle isDeleted:", {
          id: target.id, from: target.isDeleted, to: next,
        });
      }

      toast({
        title: next ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
        description: `@${target.username}`,
      });

      onOpenChange(false);
      onCompleted?.(next);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Thao tác thất bại",
        description: e?.message ?? "Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {target ? (
              <>
                Tài khoản: <span className="font-medium">@{target.username}</span>
                <br />
                {isUnblock
                  ? "Người dùng sẽ có thể đăng nhập lại và sử dụng hệ thống."
                  : "Người dùng sẽ không thể đăng nhập và sử dụng hệ thống cho đến khi được mở khóa."}
              </>
            ) : "—"}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading || !target}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
