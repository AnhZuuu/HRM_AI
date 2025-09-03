"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { authFetch } from "@/app/utils/authFetch";
import FlexibleFieldsForm from "./flexible-fields-form";
import API from "@/api/api";
import { isHR } from "@/lib/auth";

type DepartmentOption = { id: string; name: string };
// NEW: interview process option type
type InterviewProcessOption = { id: string; name: string };

const unwrap = async (res: Response) => {
  const txt = await res.text();
  const json = txt ? JSON.parse(txt) : null;
  return json?.data?.data ?? json?.data ?? json;
};

export default function AddPositionDialog({
  campaignId,
  departmentOptions = [],
}: {
  campaignId: string;
  departmentOptions?: DepartmentOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Step control
  const [showFlexibleFields, setShowFlexibleFields] = useState(false);

  // Departments
  const [departments, setDepartments] = useState<DepartmentOption[]>(departmentOptions);
  const [depsLoading, setDepsLoading] = useState(false);
  const [depsError, setDepsError] = useState<string | null>(null);

  // Form 1 state
  const [form, setForm] = useState({
    departmentId: "",
    interviewProcessId: "", // NEW: selected process
    totalSlot: 1,
    description: "",
  });
  const [errors, setErrors] = useState<{
    departmentId?: string;
    interviewProcessId?: string; // NEW
    totalSlot?: string;
  }>({});

  // NEW: interview processes fetched by department
  const [procLoading, setProcLoading] = useState(false);
  const [procError, setProcError] = useState<string | null>(null);
  const [processes, setProcesses] = useState<InterviewProcessOption[]>([]);

  // Submission
  const [submitting, setSubmitting] = useState(false);

  // Fetch departments when dialog opens (if not provided)
  useEffect(() => {
    if (!open || departmentOptions.length) return;
    let mounted = true;
    (async () => {
      setDepsLoading(true);
      setDepsError(null);
      try {
        const res = await authFetch(API.DEPARTMENT.BASE);
        if (!res.ok) throw new Error(await res.text());
        const list = (await unwrap(res)) as any[];
        const mapped: DepartmentOption[] = (Array.isArray(list) ? list : []).map((d: any) => ({
          id: d.id,
          // accept either "name" or "departmentName" from backend
          name: d.name ?? d.departmentName ?? "(không tên)",
        }));
        if (mounted) setDepartments(mapped);
      } catch (e: any) {
        if (mounted) setDepsError(e?.message ?? "Không thể tải phòng ban");
      } finally {
        if (mounted) setDepsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, departmentOptions.length]);

  // NEW: when department changes, fetch its detail to get interviewProcessModels
  const fetchProcessesByDepartment = async (deptId: string) => {
    if (!deptId) {
      setProcesses([]);
      setProcError(null);
      return;
    }
    setProcLoading(true);
    setProcError(null);
    try {

      const url = `${API.DEPARTMENT.BASE}/${deptId}`;

      const res = await authFetch(url);
      if (!res.ok) {
        let msg = "Không thể tải quy trình phỏng vấn";
        try {
          const j = await res.json();
          msg = j?.message || msg;
        } catch {
          msg = await res.text();
        }
        throw new Error(msg);
      }

      const data = await unwrap(res);
      const arr = data?.interviewProcessModels ?? [];
      const mapped: InterviewProcessOption[] = arr.map((p: any) => ({
        id: p.id,
        name: p.processName ?? "(không tên)",
      }));
      setProcesses(mapped);
    } catch (e: any) {
      setProcesses([]);
      setProcError(e?.message ?? "Không thể tải quy trình phỏng vấn");
    } finally {
      setProcLoading(false);
    }
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.departmentId) e.departmentId = "Hãy chọn phòng ban";
    if (!form.interviewProcessId) e.interviewProcessId = "Hãy chọn quy trình phỏng vấn"; // NEW
    if (!form.totalSlot || form.totalSlot < 1) e.totalSlot = "Số lượng tối thiểu là 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const reset = () => {
    setForm({ departmentId: "", interviewProcessId: "", totalSlot: 1, description: "" });
    setErrors({});
    setShowFlexibleFields(false);
    setProcesses([]);
    setProcError(null);
    setProcLoading(false);
  };

  // Step 1 → Step 2
  const handleNext = () => {
    if (!validate()) return;
    setShowFlexibleFields(true);
  };

  // Final submit with details from FlexibleFieldsForm
  const handleSaveFlexibleFields = async (details: Array<{
    type: string;
    key: string;
    value: string;
    groupIndex: number;
  }>) => {
    setSubmitting(true);
    try {
      const payload = {
        campaignId,
        departmentId: form.departmentId,
        interviewProcessId: form.interviewProcessId, // NEW
        totalSlot: Number(form.totalSlot),
        description: form.description.trim(),
        campaignPositionStatus: 0, // NEW: include if your API expects it
        campaignPositionDetailAddModels: details,
      };

      const res = await authFetch(API.CAMPAIGN.POSITION, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Try to parse a structured error first
        let message = "Create failed";
        try {
          const errJson = await res.json();
          message = errJson?.message || JSON.stringify(errJson);
        } catch {
          message = await res.text();
        }
        throw new Error(message || "Create failed");
      }

      setOpen(false);
      reset();
      router.refresh(); // reload data on page
    } catch (e) {
      console.error(e);
      // TODO: show toast if you have one
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        setOpen(v);
      }}
    >
      <DialogTrigger asChild>
        {isHR() && (
          <Button className="bg-blue-600 hover:bg-blue-700" type="button">
            <Plus className="w-4 h-4 mr-2" />
            Thêm vị trí tuyển dụng
          </Button>
        )}

      </DialogTrigger>

      <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm vị trí tuyển dụng</DialogTitle>
          <DialogDescription>
            {showFlexibleFields
              ? "Thêm các trường chi tiết (kỹ năng, công cụ, chứng chỉ...) cho vị trí."
              : "Điền thông tin cơ bản cho vị trí tuyển dụng."}
          </DialogDescription>
        </DialogHeader>

        {showFlexibleFields ? (
          <>
            <FlexibleFieldsForm
              // Per your requirement: use the Description as the name shown here
              positionName={form.description || "Vị trí tuyển dụng"}
              onSave={handleSaveFlexibleFields}
            />
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowFlexibleFields(false)} disabled={submitting}>
                ← Quay lại
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              {/* Department */}
              <div className="space-y-2">
                <Label>
                  Phòng ban <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.departmentId}
                  onValueChange={async (v) => {
                    setForm((prev) => ({ ...prev, departmentId: v, interviewProcessId: "" })); // reset process on change
                    setErrors((x) => ({ ...x, departmentId: "", interviewProcessId: "" }));
                    await fetchProcessesByDepartment(v); // NEW: fetch processes
                  }}
                  disabled={depsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={depsLoading ? "Đang tải..." : "Chọn phòng ban"} />
                  </SelectTrigger>
                  <SelectContent>
                    {depsError && (
                      <SelectItem value="__err" disabled>
                        {depsError}
                      </SelectItem>
                    )}
                    {!depsError && departments.length === 0 && !depsLoading && (
                      <SelectItem value="__none" disabled>
                        Không có dữ liệu phòng ban
                      </SelectItem>
                    )}
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentId && <p className="text-sm text-red-500">{errors.departmentId}</p>}
              </div>

              {/* NEW: Interview Process (dependent on Department) */}
              <div className="space-y-2">
                <Label>
                  Quy trình phỏng vấn <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.interviewProcessId}
                  onValueChange={(v) => {
                    setForm((prev) => ({ ...prev, interviewProcessId: v }));
                    setErrors((x) => ({ ...x, interviewProcessId: "" }));
                  }}
                  disabled={!form.departmentId || procLoading || !!procError || processes.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !form.departmentId
                          ? "Chọn phòng ban trước"
                          : procLoading
                            ? "Đang tải quy trình…"
                            : procError
                              ? procError
                              : processes.length === 0
                                ? "Không có quy trình phỏng vấn"
                                : "Chọn quy trình phỏng vấn"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {processes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.interviewProcessId && (
                  <p className="text-sm text-red-500">{errors.interviewProcessId}</p>
                )}
              </div>

              {/* Total Slot */}
              <div className="space-y-2">
                <Label>
                  Số lượng cần tuyển <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={form.totalSlot}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setForm({ ...form, totalSlot: v });
                    setErrors((x) => ({ ...x, totalSlot: "" }));
                  }}
                />
                {errors.totalSlot && <p className="text-sm text-red-500">{errors.totalSlot}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  rows={5}
                  placeholder="Mô tả chi tiết vị trí..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                {/* Optional: help text to hint name usage */}
                <p className="text-xs text-muted-foreground">
                  Lưu ý: Tên hiển thị ở bước sau sẽ lấy từ nội dung mô tả này.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Hủy
              </Button>
              <Button onClick={handleNext} disabled={submitting}>
                Tiếp tục
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
