"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

// ===== Types =====
type ApiEnvelope<T> = {
  code: number;
  status: boolean;
  message: string;
  data: T;
};

export type UpdateStatusResult = {
  id?: string;
  status: 0 | 1 | 2 | 3 | 4;
  [k: string]: any;
};

// ===== Status constants (for clarity & safety) =====
const STATUS = {
  PENDING: 0,
  REJECTED: 1,
  ACCEPTED: 2,
  FAILED: 3,
  ONBOARDED: 4,
} as const;

type StatusCode = typeof STATUS[keyof typeof STATUS];

// ===== Color helper (your mapping preserved) =====
const statusBadgeClass = (s: 0 | 1 | 2 | 3 | 4) => {
  switch (s) {
    case 4:
      return "bg-blue-100 text-blue-800";
    case 2:
      return "bg-green-100 text-green-800";
    case 1:
      return "bg-red-100 text-red-800";
    case 0:
      return "bg-yellow-100 text-blue-800";
    case 3:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// All displayable statuses (we don't present ONBOARDED as a target in the dropdown)
const ALL_STATUS_OPTIONS: Array<{ value: StatusCode; label: string }> = [
  { value: STATUS.PENDING, label: "Pending" },
  { value: STATUS.REJECTED, label: "Rejected" },
  { value: STATUS.ACCEPTED, label: "Accepted" },
  { value: STATUS.FAILED, label: "Failed" },
  // { value: STATUS.ONBOARDED, label: "Onboarded" }, // not selectable as a target
];

// Allowed transitions by current status (per your requirements)
// - Pending -> Rejected / Accepted
// - Accepted -> Rejected
// - Rejected -> Pending / Accepted
// - Onboarded -> none (locked)
// - Failed -> Pending / Accepted  (assumption; change if you need different)
const ALLOWED_TRANSITIONS: Record<StatusCode, StatusCode[]> = {
  [STATUS.PENDING]: [STATUS.REJECTED, STATUS.ACCEPTED],
  [STATUS.ACCEPTED]: [STATUS.REJECTED],
  [STATUS.REJECTED]: [STATUS.PENDING, STATUS.ACCEPTED],
  [STATUS.FAILED]: [STATUS.PENDING, STATUS.ACCEPTED], // assumption
  [STATUS.ONBOARDED]: [],
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  candidateId: string;
  initialStatus?: StatusCode; // 0 | 1 | 2 | 3 | 4
  onSuccess?: (updated: UpdateStatusResult) => void;
};

export default function HandleUpdateStatusCandidate({
  open,
  onOpenChange,
  candidateId,
  initialStatus = STATUS.PENDING,
  onSuccess,
}: Props) {
  const { toast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  // Selected target status; can be null when no transitions allowed
  const [status, setStatus] = useState<StatusCode | null>(initialStatus);

  // Re-sync when the modal opens or the source status changes
  React.useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus, open]);

  // Compute allowed target statuses from the CURRENT/INITIAL status
  const allowedTargets = useMemo<StatusCode[]>(
    () => ALLOWED_TRANSITIONS[initialStatus] ?? [],
    [initialStatus]
  );

  // Filter the full option list to only allowed targets
  const statusOptions = useMemo(
    () => ALL_STATUS_OPTIONS.filter((o) => allowedTargets.includes(o.value)),
    [allowedTargets]
  );

  // Keep selection valid (or null) whenever allowed options change
  React.useEffect(() => {
    if (statusOptions.length === 0) {
      setStatus(null);
    } else if (status == null || !statusOptions.some((o) => o.value === status)) {
      setStatus(statusOptions[0].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusOptions]);

  // Convenience label getter for the chip
  const selectedLabel =
    statusOptions.find((o) => o.value === status)?.label ?? "Chọn trạng thái";

  async function handleSubmit() {
    // No allowed transition
    if (statusOptions.length === 0 || status == null) {
      toast({
        title: "No changes allowed",
        description: "This status cannot be updated.",
      });
      return;
    }

    // Prevent no-op
    if (status === initialStatus) {
      toast({
        title: "No change selected",
        description: "Please choose a different status.",
      });
      return;
    }

    setSubmitting(true);
    try {
      // API expects cVStatus as a query param
      const url = `${API.CV.APPLICANT}/${candidateId}/change-status?cVStatus=${encodeURIComponent(
        String(status)
      )}`;

      const res = await authFetch(url, { method: "PUT" });
      const text = await res.text();
      const json: ApiEnvelope<UpdateStatusResult> = text
        ? JSON.parse(text)
        : ({} as any);

      if (!res.ok || !json?.status) {
        throw new Error(json?.message || "Update failed");
      }

      toast({
        title: "Updated successfully",
        description: "Candidate status has been updated.",
      });

      onSuccess?.(json.data ?? { status });
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cập nhật trạng thái ứng viên</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <div className="space-y-2">
            <Select
              disabled={statusOptions.length === 0 || submitting}
              value={status == null ? "" : String(status)}
              onValueChange={(v) => setStatus(Number(v) as StatusCode)}
            >
              <SelectTrigger id="status">
                {/* Colored chip inside trigger (UI preserved) */}
                <SelectValue placeholder="Không có thay đổi nào được phép">
                  {statusOptions.length === 0 ? (
                    <span className="text-muted-foreground">Không có thay đổi nào được phép</span>
                  ) : (
                    <span
                      className={`px-2 py-1 rounded text-sm ${statusBadgeClass(
                        (status ?? initialStatus) as 0 | 1 | 2 | 3 | 4
                      )}`}
                    >
                      {selectedLabel}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    <span
                      className={`px-2 py-1 rounded text-sm ${statusBadgeClass(
                        opt.value as 0 | 1 | 2 | 3 | 4
                      )}`}
                    >
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {initialStatus === STATUS.ONBOARDED && (
              <p className="text-xs text-muted-foreground">
                Ứng viên này đã onboard
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              submitting || statusOptions.length === 0 || status === initialStatus
            }
          >
            {submitting ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
