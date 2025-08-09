"use client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { DropdownMenuSeparator } from "../ui/dropdown-menu";
import { useState } from "react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  department: Department | null;
  onConfirm: (id: string) => Promise<void> | void;
};

export function DeleteDepartmentDialog({ open, onOpenChange, department, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleConfirm = async () => {
    if (!department) return;

    // Check employees
    if (department.employees && department.employees.length > 0) {
      setErrorMsg("Không thể xóa phòng ban khi vẫn còn nhân sự.");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    try {
      await onConfirm(department.id);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Xóa phòng ban?
          </DialogTitle>
          <DropdownMenuSeparator />
          <DialogDescription>
            {errorMsg ? (
              <span className="text-red-600">{errorMsg}</span>
            ) : (
              <>
                Thao tác này không thể hoàn tác. Bạn có chắc muốn xóa “
                <span className="font-bold">{department?.departmentName}</span>”?
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
