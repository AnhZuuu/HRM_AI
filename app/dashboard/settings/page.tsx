"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Voucher {
  id: string
  voucherCode: string
  discountPercentage: number
  priceCondition: number
  exceedDate: string
  isActive: boolean
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([
    {
      id: "1",
      voucherCode: "WELCOME50",
      discountPercentage: 50,
      priceCondition: 200000,
      exceedDate: "2025-08-30",
      isActive: true,
    },
    {
      id: "2",
      voucherCode: "SUMMER20",
      discountPercentage: 20,
      priceCondition: 50000,
      exceedDate: "2025-09-15",
      isActive: false,
    },
  ])
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const { toast } = useToast()

  const handleSave = () => {
    toast({ title: "Voucher updated!" })
    setShowDialog(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Config</h1>
          <p className="text-gray-600 mt-1">Manage all your system configurations</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add New Configuration
        </Button>
      </div>

      {/* Voucher Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vouchers.map((voucher) => (
          <Card
            key={voucher.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setSelectedVoucher(voucher)
              setShowDialog(true)
            }}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-gray-900">{voucher.voucherCode}</CardTitle>
                <Badge variant="outline" className={voucher.isActive ? "text-green-600 border-green-600" : "text-red-500 border-red-500"}>
                  {voucher.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-gray-600">
              <p className="text-blue-600 font-medium">Giảm {voucher.discountPercentage}%</p>
              <p>Áp dụng từ {voucher.priceCondition.toLocaleString()}₫</p>
              <p className="text-xs text-gray-500">Hết hạn: {new Date(voucher.exceedDate).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Voucher</DialogTitle>
            <DialogDescription>Update the details of your voucher.</DialogDescription>
          </DialogHeader>
          {selectedVoucher && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Voucher Code</Label>
                <Input
                  id="code"
                  value={selectedVoucher.voucherCode}
                  onChange={(e) =>
                    setSelectedVoucher({ ...selectedVoucher, voucherCode: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={selectedVoucher.discountPercentage}
                  onChange={(e) =>
                    setSelectedVoucher({
                      ...selectedVoucher,
                      discountPercentage: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Price Condition (₫)</Label>
                <Input
                  id="condition"
                  type="number"
                  value={selectedVoucher.priceCondition}
                  onChange={(e) =>
                    setSelectedVoucher({
                      ...selectedVoucher,
                      priceCondition: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={selectedVoucher.exceedDate.slice(0, 10)}
                  onChange={(e) =>
                    setSelectedVoucher({ ...selectedVoucher, exceedDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={selectedVoucher.isActive ? "active" : "inactive"}
                  onValueChange={(val) =>
                    setSelectedVoucher({ ...selectedVoucher, isActive: val === "active" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}