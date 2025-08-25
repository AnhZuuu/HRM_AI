"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";
import { ProfileCard } from "@/components/profile/profileCard";
import { ArrowLeft } from "lucide-react";

export interface AccountDetailApiResponse {
  code: number;
  status: boolean;
  message: string;
  data: Account;
}

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await authFetch(`${API.ACCOUNT.BASE}/${params.id}`);
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const json: AccountDetailApiResponse = await res.json();
        setAccount(json.data);
      } catch (e: any) {
        setError(e?.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  if (loading) return <div className="p-6">Đang tải…</div>;
  if (error) return <div className="p-6 text-red-600">Lỗi: {error}</div>;
  if (!account) return <div className="p-6">Không tìm thấy tài khoản</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chi tiết tài khoản</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
      </div>
      <ProfileCard
        data={account!}
        onEdit={() => router.push(`/dashboard/accounts/${account.id}/edit`)}
        showChangePassword={false}
      />
    </div>
  );
}
