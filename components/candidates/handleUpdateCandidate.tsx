"use client";

import * as React from "react";
import { z } from "zod";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

type ApiEnvelope<T> = {
  code: number;
  status: boolean;
  message: string;
  data: T;
};

// Matches your “update-able” fields
export type UpdateCandidatePayload = {
  fileUrl?: string | null;
  fileAlt?: string | null;
  fullName?: string | null;
  email?: string | null;
  point?: string | null;
  status?: 0 | 1 | 2 | 3 | 4;
};

export type UpdateCandidateResult = UpdateCandidatePayload & {
  id?: string;
  // any other fields returned by backend — we keep it loose
  [k: string]: any;
};

const formSchema = z.object({
  fileUrl: z.string().url().min(1).or(z.literal("").transform(() => "")),
  fileAlt: z.string().optional().or(z.literal("")),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  point: z.string().optional().or(z.literal("")),
  status: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  candidateId: string;
  initial?: Partial<UpdateCandidatePayload>;
  onSuccess?: (updated: UpdateCandidateResult) => void; // to let parent refresh UI
};

export default function HandleUpdateCandidate({
  open,
  onOpenChange,
  candidateId,
  initial,
  onSuccess,
}: Props) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<UpdateCandidatePayload>({
    fileUrl: initial?.fileUrl ?? "",
    fileAlt: initial?.fileAlt ?? "",
    fullName: initial?.fullName ?? "",
    email: initial?.email ?? "",
    point: initial?.point ?? "",
    status: (initial?.status as 0 | 1 | 2 | 3 | 4) ?? 0, // default Pending
  });

  // Reset form when initial changes (e.g., when re-opening)
  React.useEffect(() => {
    setForm({
      fileUrl: initial?.fileUrl ?? "",
      fileAlt: initial?.fileAlt ?? "",
      fullName: initial?.fullName ?? "",
      email: initial?.email ?? "",
      point: initial?.point ?? "",
      status: (initial?.status as 0 | 1 | 2 | 3 | 4) ?? 0,
    });
  }, [initial, open]);

  const statusOptions = useMemo(
    () => [
      { value: 0 as const, label: "Pending" },
      { value: 1 as const, label: "Rejected" },
      { value: 2 as const, label: "Accepted" },
      { value: 3 as const, label: "Failed" },
      // { value: 4 as const, label: "Onboarded" },
    ],
    []
  );

  async function handleSubmit() {
    // Validate before send
    const parse = formSchema.safeParse({
      ...form,
      // Allow empty fileUrl if you want; remove transform above if strictly required
    });
    if (!parse.success) {
      const first = parse.error.issues[0];
      toast({
        title: "Validation error",
        description: first?.message ?? "Please check your inputs.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // PUT to API.CV.APPLICANT/{id}
      const res = await authFetch(`${API.CV.APPLICANT}/${candidateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parse.data),
      });

      const text = await res.text();
      const json: ApiEnvelope<UpdateCandidateResult> = text ? JSON.parse(text) : ({} as any);

      if (!res.ok || !json?.status) {
        throw new Error(json?.message || "Update failed");
      }

      toast({
        title: "Updated successfully",
        description: "Candidate information has been saved.",
      });

      // Notify parent to update UI without a full refetch
      onSuccess?.(json.data ?? parse.data);
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Failed to update",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
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
              value={form.fullName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="email@example.com"
            />
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="point">Point</Label>
            <Input
              id="point"
              value={form.point ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, point: e.target.value }))}
              placeholder="36/100"
            />
          </div> */}

          {/* <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={String(form.status)}
              onValueChange={(v) => setForm((f) => ({ ...f, status: Number(v) as 0 | 1 | 2 | 3 | 4 }))}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}

          <div className="space-y-2">
            <Label htmlFor="fileUrl">Đường dẫn file CV</Label>
            <Input
              id="fileUrl"
              value={form.fileUrl ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
              placeholder="https://…"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileAlt">CV file alt</Label>
            <Input
              id="fileAlt"
              value={form.fileAlt ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, fileAlt: e.target.value }))}
              placeholder="Senior Developer CV"
            />
          </div>
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
