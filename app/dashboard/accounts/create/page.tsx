"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";
import CreateAccountFormCard, { CreateAccountFormValues, DepartmentOption, RoleOption } from "@/components/account/createAccountForm";
import { ROLE_OPTIONS } from "@/app/utils/enum";



const schema = z
  .object({
    firstName: z.string().trim().min(1, "Tên là bắt buộc").max(100),
    lastName: z.string().trim().min(1, "Họ là bắt buộc").max(100),
    username: z
      .string()
      .trim()
      .min(3, "Tên người dùng phải có ít nhất 3 ký tự")
      .max(32, "Tối đa 32 ký tự")
      .regex(/^[a-zA-Z0-9_.]+$/, "Chỉ dùng chữ, số, gạch dưới và dấu chấm"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
    confirmPassword: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
    gender: z.number().int().min(0).max(2),
    dateOfBirth: z
      .string()
      .optional()
      .refine((v) => !v || !Number.isNaN(Date.parse(v)), {
        message: "Ngày không hợp lệ",
      }),
    phoneNumber: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || (v.length >= 9 && v.length <= 20), {
        message: "Số điện thoại không hợp lệ",
      }),
    address: z.string().trim().optional(),
    roles: z.array(z.number().int().min(0).max(10)).min(1, "Chọn ít nhất 1 vai trò"),
    departmentId: z.string().optional().nullable(), 
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp",
  });

type FormValues = z.infer<typeof schema>;

export default function CreateAccountPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [depLoading, setDepLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      gender: 0,
      dateOfBirth: "",
      phoneNumber: "",
      address: "",
      roles: [], 
      departmentId: null,
    },
    mode: "onTouched",
  });

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setDepLoading(true);
        const res = await authFetch(`${API.DEPARTMENT.BASE}`, { signal: ctrl.signal });
        const payload = await res.json();
        const arr: any[] =
          Array.isArray(payload?.data?.data) ? payload.data.data
          : Array.isArray(payload?.data) ? payload.data
          : Array.isArray(payload) ? payload
          : [];
        setDepartments(arr.map((d) => ({ id: d.id, departmentName: d.departmentName })));
      } catch {
        setDepartments([]);
      } finally {
        setDepLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setSaveError(null);
    setSaveSuccess(null);

    const selectedDept = values.departmentId && values.departmentId !== "__none__"
      ? values.departmentId
      : null;

    const payload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      username: values.username.trim(),
      email: values.email.trim(),
      password: values.password,
      confirmPassword: values.confirmPassword,
      gender: Number(values.gender),
      dateOfBirth: values.dateOfBirth || null,
      phoneNumber: values.phoneNumber?.trim() || null,
      address: values.address?.trim() || "string",
      roles: values.roles, 
      
    };

    try {
      const res = await authFetch(`${API.AUTH.SIGNUP}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = `Tạo tài khoản thất bại (HTTP ${res.status}).`;
        try {
          const problem = await res.json();
          msg = problem?.message ?? problem?.detail ?? msg;
        } catch {}
        throw new Error(msg);
      }

      let createdId: string | undefined;
      const text = await res.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          const obj = json?.data ?? json;
          if (obj && typeof obj === "object" && "id" in obj) {
            createdId = obj.id as string;
          }
        } catch {}
      }

       if (createdId && selectedDept) {
        const assign = await authFetch(
          `${API.ACCOUNT.ADD_TO_DEPARTMENT}?departmentId=${encodeURIComponent(selectedDept)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([createdId]),
          }
        );
        if (!assign.ok) {
          console.warn("Assign department failed:", assign.status);
        }
      }

      setSaveSuccess("Tạo tài khoản thành công.");
      setTimeout(() => {
        if (createdId) router.push(`/dashboard/accounts/${createdId}`);
        else router.push(`/dashboard/accounts`);
      }, 400);
    } catch (e: any) {
      setSaveError(e?.message ?? "Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Tạo tài khoản</h1>
          <p className="text-muted-foreground">Nhập thông tin người dùng và vai trò.</p>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
      </div>

      {saveSuccess && (
        <Alert className="border-emerald-600/30 bg-green-500">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle>Thành công</AlertTitle>
          <AlertDescription>{saveSuccess}</AlertDescription>
        </Alert>
      )}

      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Không thể tạo tài khoản</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <CreateAccountFormCard
        form={form as unknown as UseFormReturn<CreateAccountFormValues>}
        submitting={submitting}
        onSubmit={onSubmit as (v: CreateAccountFormValues) => Promise<void>}
        onCancel={() => router.push("/dashboard/accounts")}
        roleOptions={ROLE_OPTIONS}
        departments={departments}
        departmentsLoading={depLoading}
      />
    </div>
  );
}
