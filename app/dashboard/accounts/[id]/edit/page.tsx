"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

import { authFetch } from "@/app/utils/authFetch";
import { toDateInput } from "@/app/utils/helper";
import API from "@/api/api";
import { EditProfileFormCard } from "@/components/profile/editProfileFormCard";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Tên là bắt buộc").max(100),
  lastName: z.string().trim().min(1, "Họ là bắt buộc").max(100),
  username: z
    .string()
    .trim()
    .min(3, "Tên người dùng phải có ít nhất 3 ký tự")
    .max(32)
    .regex(/^[a-zA-Z0-9_\.]+$/, "Chỉ dùng chữ, số, gạch dưới và dấu chấm"),
  email: z.string().email(),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (v.length >= 9 && v.length <= 20), {
      message: "Số điện thoại không hợp lệ",
    }),
  gender: z.number().int().min(0).max(2),
  dateOfBirth: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), {
      message: "Ngày không hợp lệ",
    }),
  departmentId: z.string().nullable().optional(),
});

type ApiResponse<T> = {
  code: number;
  status: boolean;
  message?: string;
  data: T;
};

export default function AccountEditPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const originalDeptRef = useRef<string | null>(null);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phoneNumber: "",
      dateOfBirth: "",
      departmentId: "",
      gender: 0,
    },
    mode: "onTouched",
  });

  function toPayload(values: z.infer<typeof profileSchema>) {
    return {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      username: values.username.trim(),
      email: values.email.trim(),
      phoneNumber: values.phoneNumber?.trim() || null,
      gender: Number(values.gender),
      dateOfBirth: values.dateOfBirth || null,
      departmentId: values.departmentId || null,
    };
  }

  useEffect(() => {
    if (!id) return;

    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const res = await authFetch(`${API.ACCOUNT.BASE}/${id}`, {
          method: "GET",
          signal: ctrl.signal,
        });
        if (!res.ok) {
          let msg = `Không thể tải hồ sơ (HTTP ${res.status}).`;
          try {
            const p = await res.json();
            msg = p?.message ?? p?.detail ?? msg;
          } catch {}
          throw new Error(msg);
        }

        const json = (await res.json()) as ApiResponse<Account> | Account;
        const acc: Account = (json as any).data ?? (json as Account);

        originalDeptRef.current = acc.departmentId ?? null;

        form.reset({
          firstName: acc.firstName?.trim() ?? "",
          lastName: acc.lastName?.trim() ?? "",
          username: acc.username?.trim() ?? "",
          email: acc.email?.trim() ?? "",
          phoneNumber: acc.phoneNumber ?? "",
          dateOfBirth: toDateInput(acc.dateOfBirth),
          departmentId: acc.departmentId ?? null,
          gender: Number(acc.gender ?? 0),
        });
      } catch (e: any) {
        if (ctrl.signal.aborted) return;
        setLoadError(e?.message ?? "Không thể tải dữ liệu hồ sơ.");
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [id, form]);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setSubmitting(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const res = await authFetch(`${API.ACCOUNT.BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(values)),
      });

      if (!res.ok) {
        let msg = `Cập nhật thất bại (HTTP ${res.status}).`;
        try {
          const problem = await res.json();
          msg = problem?.message ?? problem?.detail ?? msg;
        } catch {}
        throw new Error(msg);
      }

      const text = await res.text();
      const nextDept =
        values.departmentId && values.departmentId !== "__none__"
          ? values.departmentId
          : null;
      if (nextDept && nextDept !== originalDeptRef.current) {
        await authFetch(
          `${API.ACCOUNT.ADD_TO_DEPARTMENT}?departmentId=${encodeURIComponent(
            nextDept
          )}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([id]), 
          }
        ).catch((e) => console.warn("Assign dept failed:", e));
      }
      
      if (text) {
        try {
          const json = JSON.parse(text);
          const updated: Account | undefined = json?.data ?? json;
          if (
            updated &&
            typeof updated === "object" &&
            "firstName" in updated
          ) {
            form.reset({
              firstName: updated.firstName?.trim() ?? "",
              lastName: updated.lastName?.trim() ?? "",
              username: updated.username?.trim() ?? "",
              email: updated.email?.trim() ?? "",
              phoneNumber: updated.phoneNumber ?? "",
              dateOfBirth: toDateInput(updated.dateOfBirth),
              departmentId: updated.departmentId ?? "",
              gender: Number(updated.gender ?? 0),
            });
          } else {
            form.reset(values);
          }
        } catch {
          form.reset(values);
        }
      } else {
        form.reset(values);
      }

      setSaveSuccess("Đã lưu thay đổi cho tài khoản.");
    } catch (e: any) {
      setSaveError(e?.message ?? "Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-3 text-sm text-muted-foreground">
          Đang tải hồ sơ…
        </span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi tải hồ sơ</AlertTitle>
          <AlertDescription className="mt-1">{loadError}</AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => location.reload()}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <div className="mx-auto max-w-3xl p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Chỉnh sửa tài khoản
          </h1>
          <p className="text-muted-foreground">
            Cập nhật thông tin cơ bản và liên hệ của tài khoản.
          </p>
        </div>

        {saveSuccess && (
          <div className="max-w-3xl">
            <Alert className="border-emerald-600/30 bg-green-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle>Đã lưu thay đổi</AlertTitle>
              <AlertDescription>{saveSuccess}</AlertDescription>
            </Alert>
          </div>
        )}

        {saveError && (
          <div className="max-w-3xl">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Cập nhật không thành công</AlertTitle>
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          </div>
        )}

        <EditProfileFormCard
          form={form as any as UseFormReturn<Account>}
          submitting={submitting}
          onSubmit={onSubmit}
          onCancel={() => form.reset()}
        />
      </div>
      <div className="p-6 gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
      </div>
    </div>
  );
}
