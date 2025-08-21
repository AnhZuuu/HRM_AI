// CreateInterviewStageModal.tsx
"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import API from "@/api/api"
import { authFetch } from "@/app/utils/authFetch"
import { useToast } from "@/hooks/use-toast"

// ---------- UI callback shape (parent table) ----------
export type CreatedStageOut = {
  name: string
  description: string
  order: number       // UI 1-based
  duration: number    // totalTime
  typeId: string
  typeCode: string
  typeName: string
}

// ---------- Backend payload ----------
interface StagePayload {
  processId: string
  order: number          // API likely 0-based (we convert UI 1..5 -> 0..4)
  stageName: string
  description: string
  totalTime: number
  interviewTypeId: string
}

type InterviewTypeDto = {
  id: string
  code: string
  name: string
  description: string | null
}

interface CreateInterviewStageModalProps {
  interviewProcessId: string
  processName?: string

  onStageCreated?: (stage: CreatedStageOut) => void

  // optional controlled mode
  open?: boolean
  onOpenChange?: (v: boolean) => void
  hideTrigger?: boolean

  // OPTIONAL: disable orders already used by saved stages
  takenOrders?: number[]
   existingStagesCount?: number
}

const unwrap = async <T,>(res: Response): Promise<T> => {
  const txt = await res.text()
  const json = txt ? JSON.parse(txt) : null
  return (json?.data ?? json) as T
}

const postJson = async (url: string, body: unknown) => {
  const res = await authFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  })
  const txt = await res.text()
  if (!res.ok) {
    try {
      const j = txt ? JSON.parse(txt) : null
      throw new Error(j?.message || txt || "Request failed")
    } catch (e: any) {
      throw new Error(e?.message || txt || "Request failed")
    }
  }
  return txt ? JSON.parse(txt) : null
}

// ---------- Local row model ----------
type Row = {
  id: string
  order: string        // "1".."5" in UI
  name: string
  interviewTypeId: string
  totalTime: string    // minutes (string for controlled input)
  description: string
}

// ---------- Constants ----------
const ORDER_OPTIONS = ["1", "2", "3", "4", "5"]
const DURATION_MIN = 1
const DURATION_MAX = 480
const DEFAULT_TIME = "60"

// Lax GUID (accepts any hex groups 8-4-4-4-12; no strict variant/version)
const UUID_LAX_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function CreateInterviewStageModal({
  interviewProcessId,
  processName,
  onStageCreated,
  open,
  onOpenChange,
  hideTrigger = false,
  takenOrders = [],
   existingStagesCount = 0,
}: CreateInterviewStageModalProps) {
  const { toast } = useToast()

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const openState = isControlled ? open! : internalOpen
  const setOpenState = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen

  const [isSubmitting, setIsSubmitting] = useState(false)

  // interview types
  const [types, setTypes] = useState<InterviewTypeDto[]>([])
  const [typesLoading, setTypesLoading] = useState(false)

  // multi rows
  const [rows, setRows] = useState<Row[]>([])

  // fetch interview types & init rows on open
  useEffect(() => {
    if (!openState) return
    let cancelled = false

    const loadTypes = async () => {
      setTypesLoading(true)
      try {
        const res = await authFetch(`${API.INTERVIEW.TYPE}`, { method: "GET" })
        if (!res.ok) throw new Error((await res.text()) || "Failed to load interview types")
        const data = await unwrap<InterviewTypeDto[]>(res)
        if (!cancelled) setTypes(Array.isArray(data) ? data : [])
      } catch (err: any) {
        if (!cancelled) {
          setTypes([])
          toast({
            title: "Không tải được loại phỏng vấn",
            description: err?.message || "Vui lòng thử lại.",
            variant: "destructive",
          })
        }
      } finally {
        if (!cancelled) setTypesLoading(false)
      }
    }

    // init first row with first free order
    const firstAvailable = ORDER_OPTIONS.find((o) => !takenOrders.includes(Number(o))) ?? "1"
    setRows([{
      id: crypto.randomUUID(),
      order: firstAvailable,
      name: "",
      interviewTypeId: "", // default after types load
      totalTime: DEFAULT_TIME,
      description: "",
    }])

    loadTypes()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openState])

  // default type for any row missing it
  useEffect(() => {
    if (!types.length) return
    setRows((prev) =>
      prev.map((r) => (r.interviewTypeId ? r : { ...r, interviewTypeId: types[0].id }))
    )
  }, [types])

  // ---------- helpers ----------
  const hasDuplicateOrder = useMemo(() => {
    const arr = rows.map((r) => r.order).filter(Boolean)
    return new Set(arr).size !== arr.length
  }, [rows])

  const hasDuplicateName = useMemo(() => {
    const arr = rows.map((r) => r.name.trim()).filter(Boolean)
    return new Set(arr.map((s) => s.toLowerCase())).size !== arr.length
  }, [rows])

  const isOrderDisabled = (opt: string, rowId: string) => {
    const num = Number(opt)
    if (takenOrders.includes(num)) return true
    return rows.some((r) => r.id !== rowId && Number(r.order) === num)
  }

  const validDuration = (r: Row) => {
    const n = Number.parseInt(r.totalTime)
    return Number.isFinite(n) && n >= DURATION_MIN && n <= DURATION_MAX
  }

  const updateRow = (rowId: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)))
  }

  const addRow = () => {
    const used = new Set<number>([
      ...takenOrders,
      ...rows.map((r) => Number(r.order)).filter((n) => Number.isFinite(n)),
    ])
    const free = ORDER_OPTIONS.find((o) => !used.has(Number(o)))
    if (!free) {
      toast({ title: "Hết số thứ tự", description: "Bạn đã dùng hết 1–5.", variant: "destructive" })
      return
    }
    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        order: free,
        name: "",
        interviewTypeId: types[0]?.id ?? "",
        totalTime: DEFAULT_TIME,
        description: "",
      },
    ])
  }

  const removeRow = (rowId: string) => {
    setRows(prev => (prev.length <= 1 ? prev : prev.filter(r => r.id !== rowId)))
  }

  // ---------- validation + disabled reasons ----------
  const isProcessIdValid = !!interviewProcessId // dev-friendly (also accept non-GUID)
  const rowHasError = (r: Row) =>
    !r.order ||
    !r.name.trim() ||
    !r.interviewTypeId ||
    !validDuration(r)

  const submitDisabled =
    isSubmitting ||
    typesLoading ||
    rows.length === 0 ||
    hasDuplicateOrder ||
    hasDuplicateName ||
    !isProcessIdValid ||
    rows.some(rowHasError)

  // ---------- submit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isProcessIdValid) {
      toast({
        title: "processId không hợp lệ",
        description: "Thiếu hoặc không đúng định dạng.",
        variant: "destructive",
      })
      return
    }
    if (submitDisabled) return

    setIsSubmitting(true)
    try {
      // IMPORTANT: UI order 1..5 → API order 0..4
      const payloads: StagePayload[] = rows.map((r) => ({
        processId: interviewProcessId,
        order: Math.max(0, Number(r.order)),
        stageName: r.name.trim(),
        description: r.description.trim(),
        totalTime: Number.parseInt(r.totalTime),
        interviewTypeId: r.interviewTypeId,
      }))

      const promises = payloads.map((p) => postJson(`${API.INTERVIEW.STAGE}`, p))
      const results = await Promise.allSettled(promises)

      const successes: number[] = []
      const failures: { index: number; reason: string }[] = []

      results.forEach((res, i) => {
        if (res.status === "fulfilled") {
          successes.push(i)
          const t = types.find((tt) => tt.id === payloads[i].interviewTypeId)
          const type = types.find((t) => t.id === payloads[i].interviewTypeId)
          onStageCreated?.({
            name: payloads[i].stageName,
            description: payloads[i].description,
            // keep UI as 1-based
            order: Number(rows[i].order),
            duration: payloads[i].totalTime,
            typeId: t?.id ?? "",
      typeCode: t?.code ?? "",
      typeName: t?.name ?? "",
          })
        } else {
          failures.push({ index: i, reason: (res.reason as Error)?.message || "Thất bại" })
        }
      })

      if (failures.length === 0) {
        toast({ title: `Đã tạo ${successes.length} vòng phỏng vấn` })
        setRows([])
        setOpenState(false)
      } else if (successes.length === 0) {
        toast({ title: "Không tạo được vòng nào", description: failures[0]?.reason, variant: "destructive" })
      } else {
        toast({
          title: `Tạo thành công ${successes.length}, lỗi ${failures.length}`,
          description: failures.map(f => `Dòng ${f.index + 1}: ${f.reason}`).join(" • "),
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({ title: "Lỗi tạo vòng", description: err?.message || "Có lỗi xảy ra.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
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

      <DialogContent className="sm:max-w-[980px]">
        <DialogHeader>
          <DialogTitle>Tạo vòng phỏng vấn mới</DialogTitle>
          <DialogDescription>
            {processName ? <>Quy trình: <b>{processName}</b><br /></> : null}
            Thêm theo hàng: <b>TT</b> • <b>Tên</b> • <b>Loại</b> • <b>Thời gian (phút)</b> • <b>Mô tả</b>. Nhấn <b>+</b> để thêm hàng mới.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Header row with X column */}
          <div className="hidden md:grid grid-cols-12 gap-2 text-xs text-muted-foreground">
            <div className="col-span-2">TT</div>
            <div className="col-span-3">Tên</div>
            <div className="col-span-3">Loại</div>
            <div className="col-span-2">Thời gian (phút)</div>
            <div className="col-span-1">Mô tả</div>
            <div className="col-span-1 text-right">Xóa</div>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="grid grid-cols-12 gap-2">
                {/* TT */}
                <div className="col-span-12 md:col-span-2">
                  <Select value={r.order} onValueChange={(v) => updateRow(r.id, { order: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="TT" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} disabled={isOrderDisabled(opt, r.id)}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tên */}
                <div className="col-span-12 md:col-span-3">
                  <Input
                    placeholder="Tên vòng"
                    value={r.name}
                    onChange={(e) => updateRow(r.id, { name: e.target.value })}
                  />
                </div>

                {/* Loại */}
                <div className="col-span-12 md:col-span-3">
                  <Select
                    value={r.interviewTypeId}
                    onValueChange={(v) => updateRow(r.id, { interviewTypeId: v })}
                    disabled={typesLoading || types.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={typesLoading ? "Đang tải…" : (types.length === 0 ? "Chưa có loại" : "Chọn loại")} />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Thời gian (phút) */}
                <div className="col-span-12 md:col-span-2">
                  <Input
                    type="number"
                    min={DURATION_MIN}
                    max={DURATION_MAX}
                    placeholder={DEFAULT_TIME}
                    value={r.totalTime}
                    onChange={(e) => updateRow(r.id, { totalTime: e.target.value })}
                  />
                  {!(Number(r.totalTime) >= DURATION_MIN && Number(r.totalTime) <= DURATION_MAX) && (
                    <div className="mt-1 text-xs text-red-600">1–480 phút</div>
                  )}
                </div>

                {/* Mô tả */}
                <div className="col-span-12 md:col-span-1">
                  <Input
                    placeholder="Mô tả"
                    value={r.description}
                    onChange={(e) => updateRow(r.id, { description: e.target.value })}
                  />
                </div>

                {/* Xóa */}
                <div className="col-span-12 md:col-span-1 flex items-center justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(r.id)}
                    disabled={rows.length === 1}
                    title={rows.length === 1 ? "Phải có ít nhất 1 dòng" : "Xóa dòng này"}
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add row */}
          <div className="flex justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={addRow}
              disabled={ORDER_OPTIONS.every((o) => isOrderDisabled(o, ""))}
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm vòng
            </Button>
          </div>

          {/* Dev aid: why submit is disabled */}
          {submitDisabled && (
            <ul className="mt-2 text-xs text-red-600 space-y-1">
              {!isProcessIdValid && <li>- processId không hợp lệ / trống</li>}
              {rows.length === 0 && <li>- Chưa có dòng nào</li>}
              {hasDuplicateOrder && <li>- TT bị trùng</li>}
              {hasDuplicateName && <li>- Tên vòng bị trùng</li>}
              {rows.some(rowHasError) && <li>- Có dòng thiếu TT/Tên/Loại hoặc thời gian</li>}
              {typesLoading && <li>- Đang tải danh sách loại phỏng vấn</li>}
              {isSubmitting && <li>- Đang gửi yêu cầu</li>}
            </ul>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpenState(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitDisabled}>
              {isSubmitting ? "Đang tạo..." : `Tạo ${rows.length} vòng`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
