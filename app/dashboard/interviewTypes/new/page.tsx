"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, X } from "lucide-react";
import { createInterviewType, type InterviewType } from "@/components/interviewType/interviewTypeRepo";

export default function NewInterviewTypePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState("");

  const save = async () => {
    try {
      setErr("");
      if (!name.trim()) { setErr("Bắt buộc nhập tên."); return; }
      const payload: InterviewType = { name: name.trim(), description: description?.trim() || undefined };
      const created = await createInterviewType(payload);
      alert(`Tạo thành công: ${created.code}`);
      router.push("/dashboard/interviewTypes");
    } catch (e: any) {
      setErr(e?.message ?? "Lưu thất bại.");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Tạo mới loại phỏng vấn</h1>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên <span className="text-red-500">*</span></label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Online" />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium"> Mô tả</label>
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}><X className="h-4 w-4 mr-2" />Hủy</Button>
            <Button onClick={save} className="bg-blue-600 hover:bg-blue-700"><Save className="h-4 w-4 mr-2" />Lưu</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
