"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, X } from "lucide-react";
import { getInterviewTypeById, updateInterviewType } from "@/components/interviewType/interviewTypeRepo";
import { toast } from "react-toastify";

export default function EditInterviewTypePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const rec = await getInterviewTypeById(id);
      if (!rec) { toast.warning("Không tìm thấy."); router.back(); return; }
      setCode(rec.code);
      setName(rec.name);
      setDescription(rec.description ?? "");
    })();
  }, [id, router]);

  const save = async () => {
    try {
      setErr("");
      if (!name.trim()) { setErr("Bắt buộc nhập tên."); return; }
      await updateInterviewType(id, { name: name.trim(), description: description?.trim() || undefined });
      toast.success("Cập nhật thành công.");
      // router.push("/dashboard/interviewTypes");
      setTimeout(() => router.push("/dashboard/interviewTypes"), 500);
    } catch (e: any) {
      setErr(e?.message ?? "Cập nhập thất bại.");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Chỉnh sửa loại phỏng vấn</h1>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Code</label>
              <Input value={code} disabled className="font-mono" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Tên <span className="text-red-500">*</span></label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Mô tả</label>
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
