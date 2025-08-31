"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";

// API envelope
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

// Color helper (same mapping you use in the page)
const statusBadgeClass = (s: 0 | 1 | 2 | 3 | 4) => {
  switch (s) {
    case 4: return "bg-blue-100 text-blue-800";
    case 2: return "bg-green-100 text-green-800";
    case 1: return "bg-red-100 text-red-800";
    case 0: return "bg-yellow-100 text-blue-800";
    case 3: return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  candidateId: string;
  initialStatus?: 0 | 1 | 2 | 3 | 4;
  onSuccess?: (updated: UpdateStatusResult) => void;
};

export default function HandleUpdateStatusCandidate({
  open,
  onOpenChange,
  candidateId,
  initialStatus = 0,
  onSuccess,
}: Props) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<0 | 1 | 2 | 3 | 4>(initialStatus);

  React.useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus, open]);

  const statusOptions = useMemo(
    () => [
      { value: 0 as const, label: "Pending" },
      { value: 1 as const, label: "Rejected" },
      { value: 2 as const, label: "Accepted" },
      { value: 3 as const, label: "Failed" },
      { value: 4 as const, label: "Onboarded" },
    ],
    []
  );

  async function handleSubmit() {
    setSubmitting(true);
    try {
      // IMPORTANT: API expects cVStatus as a QUERY PARAM (per Swagger)
      const url = `${API.CV.APPLICANT}/${candidateId}/change-status?cVStatus=${encodeURIComponent(
        String(status)
      )}`;

      const res = await authFetch(url, {
        method: "PUT",
        // No JSON body; many frameworks will choke if you send Content-Type without a body
      });

      const text = await res.text();
      const json: ApiEnvelope<UpdateStatusResult> = text ? JSON.parse(text) : ({} as any);

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
          <DialogTitle>Update Candidate Status</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <div className="space-y-2">
            <Select
              value={String(status)}
              onValueChange={(v) => setStatus(Number(v) as 0 | 1 | 2 | 3 | 4)}
            >
              <SelectTrigger id="status">
                {/* show colored chip in the trigger */}
                <SelectValue
                  placeholder="Select status"
                  className="flex items-center"
                >
                  <span className={`px-2 py-1 rounded text-sm ${statusBadgeClass(status)}`}>
                    {statusOptions.find((o) => o.value === status)?.label ?? "Select status"}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    <span
                      className={`px-2 py-1 rounded text-sm ${statusBadgeClass(opt.value)}`}
                    >
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
