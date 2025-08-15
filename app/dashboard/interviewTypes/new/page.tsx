"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, X } from "lucide-react";
import API from "@/api/api";               // should expose API_BASE_URL or BASE_URL
import { authFetch } from "@/app/utils/authFetch"; // if you use tokenized fetch

type ApiEnvelope<T> = {
  code: number;
  status: boolean;
  message: string;
  data: T;
};

type InterviewTypeDto = {
  id: string;
  code?: string;
  name: string;
  description?: string | null;
  // ...other audit fields possibly returned by your API
};

export default function NewInterviewTypePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const getBaseUrl = () =>
    // try common keys; adjust to match your API helper
    (API as any)?.API_BASE_URL ??
    (API as any)?.BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL;

  const save = async () => {
    try {
      setErr("");
      if (!name.trim()) {
        setErr("Bắt buộc nhập tên.");
        return;
      }
      const base = getBaseUrl();
      if (!base) {
        throw new Error("API base URL is not configured.");
      }

      setSaving(true);

      const url = `${base}/interview-types`;
      const body = {
        name: name.trim(),
        description: description?.trim() || null,
      };

      const doFetch: typeof fetch =
        typeof authFetch === "function" ? (authFetch as any) : fetch;

      const res = await doFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      const text = await res.text();
      const json: ApiEnvelope<InterviewTypeDto> = text ? JSON.parse(text) : ({} as any);

      if (!res.ok || !json?.status) {
        const msg = json?.message || `Tạo thất bại (${res.status})`;
        throw new Error(msg);
      }

      const created = json.data;
      alert(`Tạo thành công${created?.code ? `: ${created.code}` : ""}`);
      router.push("/dashboard/interviewTypes");
    } catch (e: any) {
      setErr(e?.message ?? "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Tạo mới loại phỏng vấn</h1>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tên <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Trực tiếp"
                disabled={saving}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Phỏng vấn trực tiếp"
                disabled={saving}
              />
            </div>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button onClick={save} className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
