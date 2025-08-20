// CreateInterviewStageModal.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

interface InterviewStage {
  name: string
  description: string
  order: number
  duration: number
  type: string
}

interface CreateInterviewStageModalProps {
  interviewProcessId: string
  onStageCreated?: (stage: InterviewStage) => void
  existingStagesCount?: number

  // NEW (optional controlled mode)
  open?: boolean
  onOpenChange?: (v: boolean) => void
  hideTrigger?: boolean
}

export function CreateInterviewStageModal({
  interviewProcessId,
  onStageCreated,
  existingStagesCount = 0,
  open,              // optional controlled
  onOpenChange,      // optional controlled
  hideTrigger = false,
}: CreateInterviewStageModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const openState = isControlled ? open! : internalOpen
  const setOpenState = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: "",
    type: "interview",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const newStage: InterviewStage = {
        name: formData.name,
        description: formData.description,
        order: existingStagesCount + 1,
        duration: Number.parseInt(formData.duration) || 60,
        type: formData.type,
      }

      // TODO: call your API here with interviewProcessId + newStage
      console.log("Creating interview stage:", { interviewProcessId, newStage })

      onStageCreated?.(newStage)

      // Reset form
      setFormData({ name: "", description: "", duration: "", type: "interview" })

      setOpenState(false)
    } catch (error) {
      console.error("Error creating interview stage:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={openState} onOpenChange={setOpenState}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm vòng phỏng vấn
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tạo vòng phỏng vấn mới</DialogTitle>
          <DialogDescription>Thêm một vòng phỏng vấn mới vào quy trình tuyển dụng</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stage-name">Tên vòng phỏng vấn *</Label>
            <Input
              id="stage-name"
              placeholder="Ví dụ: Vòng phỏng vấn HR"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage-type">Loại vòng phỏng vấn</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại vòng phỏng vấn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interview">Phỏng vấn trực tiếp</SelectItem>
                <SelectItem value="technical">Phỏng vấn kỹ thuật</SelectItem>
                <SelectItem value="hr">Phỏng vấn HR</SelectItem>
                <SelectItem value="presentation">Thuyết trình</SelectItem>
                <SelectItem value="test">Bài kiểm tra</SelectItem>
                <SelectItem value="group">Phỏng vấn nhóm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage-duration">Thời gian (phút)</Label>
            <Input
              id="stage-duration"
              type="number"
              placeholder="60"
              min="15"
              max="480"
              value={formData.duration}
              onChange={(e) => handleInputChange("duration", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage-description">Mô tả</Label>
            <Textarea
              id="stage-description"
              placeholder="Mô tả chi tiết về vòng phỏng vấn này..."
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpenState(false)} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang tạo..." : "Tạo vòng phỏng vấn"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
