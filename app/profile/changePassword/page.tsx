"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mật khẩu hiện tại là bắt buộc"),
    newPassword: z
      .string()
      .min(8, "Ít nhất 8 ký tự")
      .regex(/[a-z]/, "Bao gồm một chữ cái thường")
      .regex(/[0-9]/, "Bao gồm một số"),
    confirmNewPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu của bạn"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmNewPassword"],
  });

export default function ChangePasswordPage() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [show, setShow] = useState<{
    current: boolean;
    next: boolean;
    confirm: boolean;
  }>({
    current: false,
    next: false,
    confirm: false,
  });

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    setSubmitting(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const res = await authFetch(API.AUTH.CHANGE_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: values.currentPassword,
          newPassword: values.newPassword,
          confirmPassword: values.confirmNewPassword,
        }),
      });

      if (!res.ok) {
        const problem = await res.json().catch(() => null);
        const msg =
          problem?.message ??
          problem?.detail ??
          `Gửi yêu cầu thất bại với lỗi ${res.status}`;
        setApiError(msg);
        return;
      }
      form.reset();
      setApiSuccess(
        "Bạn có thể sử dụng mật khẩu mới trong lần đăng nhập kế tiếp."
      );
    } catch (e: any) {
      setApiError(e?.message ?? "Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex ">
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
      <div className="mx-auto max-w-md p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Thay đổi mật khẩu
          </h1>
          <p className="text-muted-foreground">
            Chọn mật khẩu mạnh để bảo mật tài khoản của bạn.
          </p>
        </div>
        {apiError && (
          <div className="mx-auto max-w-md p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Đổi mật khẩu thất bại</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          </div>
        )}
        {apiSuccess && (
          <div className="mx-auto max-w-md p-4">
            <Alert className="bg-green-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle>Đổi mật khẩu thành công</AlertTitle>
              <AlertDescription>{apiSuccess}</AlertDescription>
            </Alert>
          </div>
        )}

        <Card>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5 pt-5"
              >
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu hiện tại</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={show.current ? "text" : "password"}
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2"
                          onClick={() =>
                            setShow((s) => ({ ...s, current: !s.current }))
                          }
                          aria-label={
                            show.current ? "Hide password" : "Show password"
                          }
                        >
                          {show.current ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu mới</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={show.next ? "text" : "password"}
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2"
                          onClick={() =>
                            setShow((s) => ({ ...s, next: !s.next }))
                          }
                          aria-label={
                            show.next ? "Hide password" : "Show password"
                          }
                        >
                          {show.next ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Phải bao gồm ít nhất 8 ký tự, một số và chữ
                        thường.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmNewPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={show.confirm ? "text" : "password"}
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2"
                          onClick={() =>
                            setShow((s) => ({ ...s, confirm: !s.confirm }))
                          }
                          aria-label={
                            show.confirm ? "Hide password" : "Show password"
                          }
                        >
                          {show.confirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {form.reset(); setApiSuccess(null);}}
                  >
                    Làm mới
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Đang thay đổi..." : "Thay đổi"}
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
