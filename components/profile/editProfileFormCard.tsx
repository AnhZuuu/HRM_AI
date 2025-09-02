"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RoleOption } from "@/app/utils/enum";

export type DepartmentOption = { id: string; name: string };

export const genderOptions = [
  { value: 0, label: "Nữ" },
  { value: 1, label: "Nam" },
] as const;

const BaseSchema = z.object({
  firstName: z.string().trim().min(1, "Vui lòng nhập tên"),
  lastName: z.string().trim().min(1, "Vui lòng nhập họ"),
  username: z.string().trim().min(3, "Tên người dùng tối thiểu 3 ký tự"),
  email: z.string().email().optional(), 
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[0-9+()\-\s]{8,20}$/.test(v), "Số điện thoại không hợp lệ"),
  gender: z.number().int(),
  dateOfBirth: z.string().optional(), 
  departmentId: z.string().optional(),
  role: z.number().int().optional(),
});

export type ProfileFormValues = z.infer<typeof BaseSchema>;

export type ProfileFormProps = {
  defaultValues: ProfileFormValues;
  onSubmit: (values: ProfileFormValues) => Promise<void> | void;

  submitting?: boolean;
  showReset?: boolean;
  submitLabel?: string;

  showDepartment?: boolean;
  showRole?: boolean;

  departments?: DepartmentOption[];
  roles?: RoleOption[];

  departmentsLoading?: boolean;
  disableEmail?: boolean;
  className?: string;
};

export function ProfileForm({
  defaultValues,
  onSubmit,
  submitting,
  showReset = true,
  submitLabel = "Lưu thay đổi",
  showDepartment = true,
  showRole = true,
  departments = [],
  roles = [],
  departmentsLoading = false,
  disableEmail = true,
  className,
}: ProfileFormProps) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(BaseSchema),
    defaultValues,
  });

  return (
    <Card className={className ?? "mx-auto max-w-4xl rounded-2xl"}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Thông tin cơ bản</CardTitle>
        <p className="text-muted-foreground">
          Chỉnh sửa thông tin cá nhân cơ bản của tài khoản và thông tin liên hệ.
        </p>
      </CardHeader>

      <CardContent>
        <form className="grid gap-5 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <Label htmlFor="firstName">Tên</Label>
            <Input id="firstName" {...form.register("firstName")} placeholder="Nhập tên" />
            <FormError msg={form.formState.errors.firstName?.message} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="lastName">Họ</Label>
            <Input id="lastName" {...form.register("lastName")} placeholder="Nhập họ" />
            <FormError msg={form.formState.errors.lastName?.message} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="username">Tên người dùng</Label>
            <Input id="username" {...form.register("username")} placeholder="ví dụ: tienle" />
            <FormError msg={form.formState.errors.username?.message} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...form.register("email")} disabled={disableEmail} />
            <FormError msg={form.formState.errors.email?.message} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="phoneNumber">Số điện thoại</Label>
            <Input id="phoneNumber" {...form.register("phoneNumber")} placeholder="0987..." />
            <FormError msg={form.formState.errors.phoneNumber?.message} />
          </div>

          <div className="space-y-1">
            <Label>Giới tính</Label>
            <Select
              value={String(form.watch("gender"))}
              onValueChange={(v) => form.setValue("gender", Number(v), { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn giới tính" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((g) => (
                  <SelectItem key={g.value} value={String(g.value)}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError msg={form.formState.errors.gender?.message as any} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="dateOfBirth">Ngày sinh</Label>
            <Input id="dateOfBirth" type="date" {...form.register("dateOfBirth")} />
            <FormError msg={form.formState.errors.dateOfBirth?.message} />
          </div>

          {/* {showDepartment && (
            <div className="space-y-1">
              <Label>Phòng ban</Label>
              <Select
                value={form.watch("departmentId") || ""}
                onValueChange={(v) => form.setValue("departmentId", v, { shouldDirty: true })}
                disabled={departmentsLoading || departments.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={departmentsLoading ? "Đang tải phòng ban..." : "Chọn phòng ban"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError msg={form.formState.errors.departmentId?.message} />
            </div>
          )} */}

          {showRole && (
            <div className="space-y-1 md:col-span-2">
              <Label>Vai trò</Label>
              <Select
                value={form.watch("role") ? String(form.watch("role")) : ""}
                onValueChange={(v) => form.setValue("role", Number(v), { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn 1 vai trò" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.value} value={String(r.value)}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError msg={form.formState.errors.role?.message as any} />
            </div>
          )}

          <Separator className="md:col-span-2" />

          <div className="flex gap-3 md:col-span-2 items-center justify-end">
            {showReset && (
              <Button type="button" variant="outline" onClick={() => form.reset(defaultValues)}>
                Xóa các thay đổi
              </Button>
            )}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FormError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-600 mt-1">{msg}</p>;
}
