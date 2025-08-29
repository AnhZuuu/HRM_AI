"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";


import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";
import { ROLE_OPTIONS, RoleOption } from "@/app/utils/enum";
import { ProfileForm, ProfileFormValues } from "@/components/profile/editProfileFormCard";
import { useDecodedToken } from "@/components/auth/useDecodedToken";

type Account = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  gender: number;
  dateOfBirth?: string;
  phoneNumber?: string;
  departmentId?: string;
  accountRoles?: { role?: number; roleName?: string }[];
};

type AccountDetailApiResponse = {
  code: number;
  status: boolean;
  message: string;
  data: Account;
};

const roleNameToValue = new Map<string, number>(
  (ROLE_OPTIONS as RoleOption[]).map((r) => [r.label.toLowerCase(), r.value])
);

export default function EditAccountPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [account, setAccount] = React.useState<Account | null>(null);

  React.useEffect(() => {
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

  const primary = account.accountRoles?.[0];
  let roleValue: number | undefined;
  if (typeof primary?.role === "number") {
    roleValue = ROLE_OPTIONS.find((r) => r.value === primary.role!)?.value;
  }
  if (roleValue === undefined && primary?.roleName) {
    roleValue = roleNameToValue.get(primary.roleName.toLowerCase());
  }

  const defaults: ProfileFormValues = {
    firstName: account.firstName ?? "",
    lastName: account.lastName ?? "",
    username: account.username ?? "",
    email: account.email ?? "",
    phoneNumber: account.phoneNumber ?? "",
    gender: typeof account.gender === "number" ? account.gender : 0,
    dateOfBirth: account.dateOfBirth ?? "",
    departmentId: account.departmentId ?? "",
    role: roleValue,
  };

  async function handleSubmit(values: ProfileFormValues) {
    try {
      setSaving(true);

      const payload: any = {
        firstName: values.firstName,
        lastName: values.lastName,
        username: values.username,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth || null,
        phoneNumber: values.phoneNumber || null,
        roles: values.role ? [values.role] : [],
      };
      if (values.departmentId) payload.departmentId = values.departmentId;

      const res = await authFetch(`${API.ACCOUNT.BASE}/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Cập nhật thất bại (${res.status})`);
      }

      toast.success("Đã lưu thay đổi");
      router.push(`/profile`);
    } catch (e: any) {
      toast.error("Không thể cập nhật");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-hidden mx-auto max-w-3xl p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Chỉnh sửa thông tin cá nhân</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>

      <ProfileForm
        defaultValues={defaults}
        onSubmit={handleSubmit}
        submitting={saving}
        showReset
        submitLabel="Lưu thay đổi"
        showDepartment={false}
        showRole={false}
        disableEmail={true}
      />
    </div>
  );
}
