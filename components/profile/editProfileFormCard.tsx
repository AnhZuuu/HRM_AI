"use client";

import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";
import { ROLE_OPTIONS } from "@/app/utils/enum";
import { EditAccountFormValues } from "@/app/dashboard/accounts/[id]/edit/page";

type DepartmentOption = {
  id: string;
  departmentName: string;
};
const NONE_DEPT = "__none__";


type EditProfileFormCardProps = {
  form: UseFormReturn<EditAccountFormValues>;
  submitting?: boolean;
  onSubmit: (values: EditAccountFormValues) => Promise<void> | void;
  onCancel?: () => void;
  departments?: DepartmentOption[];
  loadDepartments?: boolean;
  departmentApi?: string;
};

export function EditProfileFormCard({
  form,
  submitting = false,
  onSubmit,
  onCancel,
  departments,
  loadDepartments = true,
  departmentApi = API.DEPARTMENT.BASE,
}: EditProfileFormCardProps) {
  const [internalDeps, setInternalDeps] = React.useState<DepartmentOption[]>(
    []
  );
  const [depLoading, setDepLoading] = React.useState(false);
  const [depError, setDepError] = React.useState<string | null>(null);

  const shouldFetch =
    loadDepartments && (!departments || departments.length === 0);

  React.useEffect(() => {
    if (!shouldFetch) return;
    const ctrl = new AbortController();

    (async () => {
      try {
        setDepLoading(true);
        setDepError(null);

        const res = await authFetch(departmentApi, { signal: ctrl.signal });
        if (!res.ok) {
          let msg = `Không thể tải danh sách phòng ban (HTTP ${res.status}).`;
          try {
            const p = await res.json();
            msg = p?.message ?? p?.detail ?? msg;
          } catch {}
          throw new Error(msg);
        }

        const payload = await res.json();
        const arr: any[] = Array.isArray(payload?.data?.data)
          ? payload.data.data
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : [];

        setInternalDeps(
          arr.map((d: any) => ({
            id: d.id,
            departmentName: d.departmentName,
          }))
        );
      } catch (e: any) {
        if (ctrl.signal.aborted) return;
        setDepError(e?.message ?? "Không thể tải phòng ban.");
        setInternalDeps([]);
      } finally {
        setDepLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [shouldFetch, departmentApi]);

  const depsToUse: DepartmentOption[] =
    departments && departments.length > 0 ? departments : internalDeps;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên người dùng</FormLabel>
                    <FormControl>
                      <Input placeholder="JohnDoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="johndoe@gmail.com"
                        className="py-2 px-4 border rounded disabled:opacity-50" 
                        disabled
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại</FormLabel>
                    <FormControl>
                      <Input placeholder="0987654321" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giới tính</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Nữ</SelectItem>
                        <SelectItem value="1">Nam</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày sinh</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phòng ban</FormLabel>

                    {depsToUse.length > 0 ? (
                      <Select
                        disabled={depLoading || submitting}
                        // Nếu departmentId null/undefined -> chọn sentinel
                        value={field.value ?? NONE_DEPT}
                        onValueChange={(v) =>
                          field.onChange(v === NONE_DEPT ? null : v)
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                depLoading ? "Đang tải..." : "Chọn phòng ban"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* KHÔNG dùng value="" nữa */}
                          <SelectItem value={NONE_DEPT}>
                            — Không thuộc phòng ban —
                          </SelectItem>
                          {depsToUse.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.departmentName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <FormControl>
                        <Input
                          placeholder={
                            depLoading
                              ? "Đang tải..."
                              : "Nhập ID phòng ban (tạm thời)"
                          }
                          disabled={depLoading || submitting}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                        />
                      </FormControl>
                    )}

                    {depError ? (
                      <p className="mt-1 text-xs text-red-600">{depError}</p>
                    ) : null}

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="accountRoles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vai trò</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value?.length ? String(field.value[0]) : undefined}
                      onValueChange={(v) => field.onChange([Number(v)])}
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn 1 vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={String(r.value)}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => (onCancel ? onCancel() : form.reset())}
              >
                Xóa các thay đổi
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
