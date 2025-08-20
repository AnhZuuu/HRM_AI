"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { toDateInput } from "@/app/utils/helper";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Tên là bắt buộc").max(100),
  lastName: z.string().trim().min(1, "Họ là bắt buộc").max(100),
  username: z
    .string()
    .trim()
    .min(3, "Tên người dùng phải có ít nhất 3 ký tự")
    .max(32)
    .regex(
      /^[a-zA-Z0-9_\.]+$/,
      "Chỉ được phép sử dụng chữ cái, số, dấu gạch dưới và dấu chấm"
    ),
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

// Demo defaults — replace with data fetched from your API
const demo: Account = {
  firstName: "Tien",
  lastName: "Le",
  username: "TienLe",
  email: "thuytienln238@gmail.com",
  gender: 0,
  dateOfBirth: "2000-08-20",
  phoneNumber: "0987654321",
  departmentId: null,
  image: null,
  emailConfirmed: true,
  phoneNumberConfirmed: false,
  accountRoles: [
    {
      totalReputation: 0,
      status: 0,
      role: 3,
      roleName: "Employee",
      id: "77f3881f-1e73-41f9-a8e5-08dddfc80cae",
    },
  ],
  id: "8999bf0a-c863-458f-a8e4-08dddfc80cae",
  creationDate: "2025-08-20T09:00:45.5484266",
  modificationDate: "2025-08-20T09:01:31.4364312",
  isDeleted: false,
};

export default function EditProfilePage({
  initial = demo,
}: {
  initial?: Account;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: (initial.firstName ?? "").trim(),
      lastName: (initial.lastName ?? "").trim(),
      username: (initial.username ?? "").trim(),
      email: (initial.email ?? "").trim(),
      phoneNumber: (initial.phoneNumber ?? "").trim(),
      dateOfBirth: toDateInput(initial.dateOfBirth),
      departmentId: initial.departmentId ?? "",
      gender: Number(initial.gender ?? 2),
    },
    mode: "onTouched",
  });

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setSubmitting(true);
    try {
      // TODO: call your API
      // await authFetch("/api/profile", { method: "PUT", body: JSON.stringify(values) })
      await new Promise((r) => setTimeout(r, 600));
      toast({
        title: "Hồ sơ đã được cập nhật",
        description: "Những thay đổi của bạn đã được lưu.",
      });
    } catch (e: any) {
      toast({
        title: "Cập nhật không thành công",
        description: e?.message ?? "Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex">
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
      <div className="mx-auto max-w-3xl p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Chỉnh sửa thông tin cá nhân
          </h1>
          <p className="text-muted-foreground">
            Chỉnh sửa thông tin cá nhân cơ bản của tài khoản và thông tin liên hệ.
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
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
                              <SelectValue placeholder="Select" />
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
                        <FormControl>
                          <Input
                            placeholder="Chọn phòng ban"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
