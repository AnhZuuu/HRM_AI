"use client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { DropdownMenuSeparator } from "../ui/dropdown-menu";
import { toast, ToastContainer } from "react-toastify";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  campaign: Campaign | null;
  onConfirm: (id: string) => Promise<void> | void; 
};

export default function DeleteCampaignDialog({ open, onOpenChange, campaign, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
  if (!campaign) return;
  setLoading(true);
  try {
    await onConfirm(campaign.id);

    toast.success("Xóa chiến dịch thành công!"); // <-- success popup
    onOpenChange(false);
  } catch (err: any) {
    toast.error(err?.message || "Xác nhận thất bại."); // <-- error popup
  } finally {
    setLoading(false);
  }
};

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle  className="h-5 w-5 text-red-600" />
            Xóa đợt tuyển dụng?
          </DialogTitle>
          <DropdownMenuSeparator />
          <DialogDescription>
            Thao tác này không thể hoàn tác. Bạn có chắc muốn xóa “<span className="font-bold">{campaign?.name}</span>”?
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
     <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
