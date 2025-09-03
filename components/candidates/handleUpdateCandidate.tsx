"use client";

import * as React from "react";
import { z } from "zod";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";
import { toast } from "react-toastify";

type ApiEnvelope<T> = {
  code: number;
  status: boolean;
  message: string;
  data: T;
};

type ReadonlyFields = {
  fileUrl?: string | null;
  fileAlt?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  candidateId: string;

  // current values to show (from your table/api)
  initial?: {
    fullName?: string | null;
    email?: string | null;
    fileUrl?: string | null;
    fileAlt?: string | null;
    status?: 0 | 1 | 2 | 3 | 4 | null; // giữ nguyên
    point?: string | null;
  };

  // campaignPositionId must be provided by parent (not shown on form)
  campaignPositionId: string;

  onSuccess?: (updated: any) => void;
};

const formSchema = z.object({
  fullName: z.string().trim().min(1, "Họ và tên đầy đủ là bắt buộc."),
  email: z.string().trim().email("Địa chỉ email không hợp lệ."),
});

export default function HandleUpdateCandidate({
  open,
  onOpenChange,
  candidateId,
  initial,
  campaignPositionId,
  onSuccess,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");

  React.useEffect(() => {
    if (open) {
      setFullName(initial?.fullName ?? "");
      setEmail(initial?.email ?? "");
    }
  }, [open, initial?.fullName, initial?.email]);

  async function handleSubmit() {
    const parsed = formSchema.safeParse({ fullName, email });
    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message ?? "Please check your inputs."
      );
      return;
    }

    // Toggle this if your backend requires PascalCase keys exactly as in Swagger.
    // const USE_PASCAL_CASE = false;

    const payloadCamel = {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      campaignPositionId, // hidden, required by new API
      status: (initial?.status ?? 0) as 0 | 1 | 2 | 3 | 4,
      point: initial?.point ?? "",
      fileUrl: initial?.fileUrl ?? "", // read-only nhưng vẫn gửi
      fileAlt: initial?.fileAlt ?? "", // read-only nhưng vẫn gửi
      cVApplicantDetailsUpdateModels: [], // always empty, as requested
      // fileUrl/fileAlt are intentionally NOT sent to prevent edits
    };

    const payloadPascal = {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      campaignPositionId: campaignPositionId,
      status: (initial?.status ?? 0) as 0 | 1 | 2 | 3 | 4,
      point: initial?.point ?? "",
      fileUrl: initial?.fileUrl ?? "",
      fileAlt: initial?.fileAlt ?? "",
      cVApplicantDetailsUpdateModels: [] as any[], // name per Swagger image
    };
    setSubmitting(true);
    try {
      const res = await authFetch(`${API.CV.APPLICANT}/${candidateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadCamel),
      });
      console.log(res);

      const text = await res.text();
      const json: ApiEnvelope<any> = text ? JSON.parse(text) : ({} as any);

      if (!res.ok || !json?.status) {
        throw new Error(json?.message || "Update failed");
      }

      toast.success("Thông tin ứng viên đã được lưu.");
      onSuccess?.(json.data ?? payloadCamel);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cập nhật thông tin ứng viên</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
     
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ tên</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <ReadonlyRow
            label="Đường dẫn file CV"
            value={initial?.fileUrl ?? ""}
          />
          <ReadonlyRow label="CV file alt" value={initial?.fileAlt ?? ""} />
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Đang lưu…" : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReadonlyRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value ?? ""} disabled readOnly />
    </div>
  );
}
