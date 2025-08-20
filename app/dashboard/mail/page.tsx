"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, RefreshCcw } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";

type TemplateTypeOption = { value: string; label: string };

/**
 * Use numeric string values ("0"…"5") so the backend gets numbers every time.
 * 0: Xác minh email
 * 1: (chưa làm)
 * 2: Thông báo lịch phỏng vấn
 * 3: Thông báo offer
 * 4: (chưa làm)
 * 5: Thư mới / Newsletter
 */
const DEFAULT_TYPE_OPTIONS: TemplateTypeOption[] = [
  { value: "0", label: "Xác minh email" },                // VERIFY_EMAIL
  { value: "1", label: "— (chưa triển khai)" },           // not implemented
  { value: "2", label: "Thông báo lịch phỏng vấn" },
  { value: "3", label: "Thông báo offer" },
  { value: "4", label: "— (chưa triển khai)" },           // not implemented
  { value: "5", label: "Thư mới (Newsletter)" },
];

const EMAILS_URL = `${API.MAIL.BASE}`;

const unwrap = async (res: Response) => {
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  return json?.data?.data ?? json?.data ?? json ?? null;
};

export default function EmailTemplateEditor({
  typeOptions = DEFAULT_TYPE_OPTIONS,
}: {
  typeOptions?: TemplateTypeOption[];
}) {
  const { toast } = useToast();

  // "type" holds a numeric string "0"…"5"
  const [type, setType] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState(""); // HTML content with {{Placeholders}}
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  // AbortController to cancel older requests when switching fast
  const abortRef = useRef<AbortController | null>(null);

  const canSave = useMemo(
    () => Boolean(templateId && subject.trim() && body.trim()) && !loading && !saving,
    [templateId, subject, body, loading, saving]
  );

  const resetFields = () => {
    setTemplateId(null);
    setSubject("");
    setBody("");
    setTouched(false);
  };

  const fetchTemplate = async (emailTypeStr: string) => {
    // cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    resetFields();

    try {
      // Ensure number for backend
      const emailType = Number(emailTypeStr);
      if (!Number.isFinite(emailType)) {
        throw new Error("Loại mẫu không hợp lệ.");
      }

      const url = `${EMAILS_URL}?emailType=${emailType}`;
      const res = await authFetch(url, { method: "GET", signal: controller.signal });

      if (!res.ok) {
        // For unimplemented types (1, 4), backend may return 400/404.
        // We’ll show a friendly note and keep fields empty.
        const txt = await res.text();
        let msg = "Không tải được mẫu email.";
        try {
          const j = txt ? JSON.parse(txt) : null;
          msg = j?.message || msg;
        } catch {
          /* ignore parse error */
        }
        // Only toast if not aborted
        if (!controller.signal.aborted) {
          toast({
            title: "Không tải được mẫu",
            description: msg || "Mẫu chưa triển khai hoặc không tồn tại.",
            variant: "destructive",
          });
        }
        resetFields();
        return;
      }

      const data = await unwrap(res); // expect: { id, subject, body } or null

      if (controller.signal.aborted) return; // ignore if aborted

      setTemplateId(data?.id ?? null);
      setSubject(data?.subject ?? "");
      setBody(data?.body ?? "");
      setTouched(false);
    } catch (err: any) {
      if (err?.name === "AbortError") return; // ignore aborted fetch
      toast({
        title: "Lỗi tải mẫu",
        description: err?.message || "Vui lòng thử lại.",
        variant: "destructive",
      });
      resetFields();
    } finally {
      if (!abortRef.current?.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    if (!type) {
      resetFields();
      return;
    }
    fetchTemplate(type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleSave = async () => {
    if (!templateId) {
      toast({ title: "Chưa có templateId.", description: "Vui lòng chọn loại mẫu đã triển khai.", variant: "destructive" });
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Thiếu dữ liệu", description: "Vui lòng nhập đầy đủ subject và body.", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const res = await authFetch(`${EMAILS_URL}/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
      });

      if (!res.ok) {
        const txt = await res.text();
        let message = "Cập nhật thất bại.";
        try {
          const j = txt ? JSON.parse(txt) : null;
          message = j?.message || message;
        } catch { /* ignore */ }
        throw new Error(message);
      }

      await unwrap(res);
      setTouched(false);
      toast({ title: "Đã lưu mẫu email", description: `Loại: ${type}` });
    } catch (err: any) {
      toast({
        title: "Không thể lưu mẫu email",
        description: err?.message ?? "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900">📧 Chỉnh sửa mẫu email</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Type */}
          <div className="space-y-2">
            <Label>Loại mẫu (type) *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại mẫu email" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templateId && (
              <div className="text-xs text-muted-foreground">Template ID: {templateId}</div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Tiêu đề (subject) *</Label>
            <Input
              id="subject"
              placeholder="Nhập tiêu đề email"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setTouched(true);
              }}
              disabled={!type || loading}
            />
          </div>

          {/* Body (HTML with placeholders) */}
          <div className="space-y-2">
            <Label htmlFor="body">Nội dung*</Label>
            <Textarea
              id="body"
              rows={10}
              placeholder='VD: <p>Chào {{UserName}},</p><p>Mã: <strong>{{VerificationCode}}</strong></p><p>Hết hạn sau {{ExpiryMinutes}} phút.</p>'
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setTouched(true);
              }}
              disabled={!type || loading}
            />
            <p className="text-xs text-muted-foreground">
              Lưu ý: Không đổi tên các placeholder (ví dụ {"{{UserName}}"}, {"{{VerificationCode}}"}, {"{{ExpiryMinutes}}"}) nếu backend đang dùng chúng.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {loading
                ? "Đang tải mẫu…"
                : touched
                ? "Đã chỉnh sửa — chưa lưu"
                : type
                ? "Đã đồng bộ"
                : "Chưa chọn loại mẫu"}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => type && fetchTemplate(type)}
                disabled={!type || loading}
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Làm mới
              </Button>

              <Button onClick={handleSave} disabled={!canSave} className="bg-blue-600 hover:bg-blue-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Lưu mẫu
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
