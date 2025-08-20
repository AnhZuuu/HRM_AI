"use client";

import { useDecodedToken } from "@/components/auth/useDecodedToken";

import { useToast } from "@/components/ui/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "@/components/profile/page";

type ApiResponse<T> = {
  code: number;
  status: boolean;
  message?: string;
  data: T;
};

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { claims, expired } = useDecodedToken();

  const accountId = claims?.accountId ?? null;

  const [data, setData] = useState<Account | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(
    () => (accountId ? `${API.ACCOUNT.BASE}/${accountId}` : null),
    [accountId]
  );

  const fetchProfile = useCallback(
    async (signal?: AbortSignal) => {
      if (!endpoint) return; // wait for id
      try {
        setLoading(true);
        setError(null);

        const res = await authFetch(endpoint, { method: "GET", signal });
        console.log(res)

        if (res.status === 401) {
          toast({
            title: "Phiên đăng nhập đã hết hạn",
            description: "Vui lòng đăng nhập lại.",
            variant: "destructive",
          });
          // router.replace("/?reason=expired");
          return;
        }

        if (!res.ok) {
          let message = `Không thể tải hồ sơ (HTTP ${res.status}).`;
          try {
            const problem = await res.json();
            message = problem?.message ?? problem?.detail ?? message;
          } catch {}
          throw new Error(message);
        }

        const json = (await res.json()) as ApiResponse<Account>;
        console.log(json);
        setData(json.data);
        setError(null);
        setLoading(false);
      } catch (e: any) {
        if (signal?.aborted) return;
        setError(e?.message ?? "Đã xảy ra lỗi khi tải hồ sơ.");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [endpoint, router, toast]
  );

  useEffect(() => {
    if (expired) {
      toast({
        title: "Phiên đăng nhập đã hết hạn",
        description: "Vui lòng đăng nhập lại.",
        variant: "destructive",
      });
      // setTimeout(() => router.replace("/?reason=expired"), 50);
      return;
    }
    if (!endpoint) return; 
    const ctrl = new AbortController();
    fetchProfile(ctrl.signal);
    return () => ctrl.abort();
  }, [endpoint, expired, fetchProfile, router, toast]);

  if  (!accountId && !expired) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-3 text-sm text-muted-foreground">Đang khởi tạo…</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-3 text-sm text-muted-foreground">Đang tải hồ sơ…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi tải hồ sơ</AlertTitle>
          <AlertDescription className="mt-1">{error}</AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => fetchProfile()}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto p-8 text-sm text-muted-foreground">
        Không có dữ liệu hồ sơ để hiển thị.
      </div>
    );
  }

  return (
    <ProfileCard
      data={data!}
      onEdit={() => router.push("/profile/edit")}
      onChangePassword={() => router.push("/profile/changePassword")}
    />
  );
}
