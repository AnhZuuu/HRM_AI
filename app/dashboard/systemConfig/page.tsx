"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-toastify";
import { Download, Upload, RefreshCw, Save, Search, Filter, Layers } from "lucide-react";
import { useConfig } from "@/components/systemConfig/configProvider";
import { AlertDialog } from "@radix-ui/react-alert-dialog";
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

/* ========= 1) Khai báo metadata cho các key để render bảng ========= */
// Bạn có thể mở rộng list này, hoặc fetch từ BE nếu sau này chuyển sang server-config
type FieldType = "number" | "boolean" | "string" | "json" | "percent";
type ConfigRowDef = {
  key: keyof ReturnType<typeof useConfig>["config"];
  label: string;
  group: "hr" | "security" | "payment" | "system" | "notifications";
  type: FieldType;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
};

const CONFIG_DEFS: ConfigRowDef[] = [
  // HR group
  {
    key: "INTERVIEW_FEEDBACK_EARLY_MINUTES" as any,
    label: "Cho đánh giá sớm (phút)",
    group: "hr",
    type: "number",
    description: "Cho phép nhập đánh giá X phút trước giờ bắt đầu phỏng vấn.",
    min: 0, step: 1,
  },
  {
    key: "INTERVIEW_FEEDBACK_LATE_MINUTES" as any,
    label: "Cho đánh giá muộn (phút)",
    group: "hr",
    type: "number",
    description: "Cho phép nhập đánh giá X phút sau giờ kết thúc.",
    min: 0, step: 1,
  },
  {
    key: "ALLOW_PRE_INTERVIEW_FEEDBACK" as any,
    label: "Bật đánh giá trước giờ",
    group: "hr",
    type: "boolean",
    description: "Nếu bật, bỏ qua kiểm tra thời gian bắt đầu.",
  },

  // System group
  // {
  //   key: "USE_SERVER_TIME" as any,
  //   label: "Dùng giờ server",
  //   group: "system",
  //   type: "boolean",
  //   description: "(FE-only) Hiện đang dùng giờ client; có thể chuyển BE sau.",
  // },

  // Payment (ví dụ để bạn mở rộng dần)
  // {
  //   key: "WALLET_TOPUP_MIN" as any,
  //   label: "Số tiền nạp tối thiểu",
  //   group: "payment",
  //   type: "number",
  //   description: "Giới hạn nạp thấp nhất (VNĐ).",
  //   min: 0, step: 1000,
  // },
];

/* ========= 2) Helpers ========= */

const GROUP_OPTIONS = [
  { value: "all", label: "Tất cả nhóm" },
  { value: "hr", label: "HR" },
  { value: "system", label: "System" },
  { value: "security", label: "Security" },
  { value: "payment", label: "Payment" },
  { value: "notifications", label: "Notifications" },
] as const;

function TypeBadge({ t }: { t: FieldType }) {
  const map: Record<FieldType, string> = {
    boolean: "bg-blue-100 text-blue-800",
    number: "bg-emerald-100 text-emerald-800",
    percent: "bg-teal-100 text-teal-800",
    string: "bg-slate-100 text-slate-800",
    json: "bg-amber-100 text-amber-800",
  };
  return <Badge className={`${map[t]} font-normal`}>{t}</Badge>;
}

function GroupBadge({ g }: { g: ConfigRowDef["group"] }) {
  const map: Record<ConfigRowDef["group"], string> = {
    hr: "bg-pink-100 text-pink-800",
    system: "bg-indigo-100 text-indigo-800",
    security: "bg-red-100 text-red-800",
    payment: "bg-green-100 text-green-800",
    notifications: "bg-violet-100 text-violet-800",
  };
  return <Badge className={`${map[g]} font-normal`}>{g}</Badge>;
}

/* ========= 3) Trang chính ========= */

export default function SystemConfigsPage() {
  const { config, setConfig, resetConfig } = useConfig();
  const [openResetConfirm, setOpenResetConfirm] = useState(false);

  // UI state
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<(typeof GROUP_OPTIONS)[number]["value"]>("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Local draft (để inline edit từng cell trước khi Save All)
  const [draft, setDraft] = useState<any>({});

  // Init draft theo config thực tế
  useEffect(() => {
    setDraft(config);
  }, [config]);

  // Filtered rows
  const rows = useMemo(() => {
    const text = search.trim().toLowerCase();
    return CONFIG_DEFS.filter((d) => {
      const byGroup = group === "all" ? true : d.group === group;
      const byText =
        !text ||
        d.key.toString().toLowerCase().includes(text) ||
        d.label.toLowerCase().includes(text) ||
        (d.description ?? "").toLowerCase().includes(text);
      return byGroup && byText;
    });
  }, [group, search]);

  // Pagination
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = rows.slice((page - 1) * pageSize, page * pageSize);

  // Handlers
  const updateDraft = (k: string, v: any) =>
    setDraft((prev: any) => ({ ...prev, [k]: v }));

  const saveAll = () => {
    // Chỉ save những key có trong defs để an toàn
    const payload: Record<string, any> = {};
    for (const r of CONFIG_DEFS) {
      payload[r.key as string] = draft[r.key as string];
    }
    setConfig(payload);
    toast.success("Đã lưu thay đổi.");
  };

  const exportJSON = async () => {
    const payload: Record<string, any> = {};
    for (const r of CONFIG_DEFS) {
      payload[r.key as string] = draft[r.key as string];
    }
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.success("Đã copy JSON vào clipboard.");
  };

  const importJSON = async () => {
    try {
      const text = prompt("Dán JSON cấu hình vào đây:");
      if (!text) return;
      const obj = JSON.parse(text);
      // Merge, chỉ nhận key có định nghĩa
      const merged: any = { ...draft };
      for (const r of CONFIG_DEFS) {
        const k = r.key as string;
        if (k in obj) merged[k] = coerceByType(obj[k], r.type);
      }
      setDraft(merged);
      toast.success("Đã nhập JSON. Nhấn Save để áp dụng.");
    } catch {
      toast.error("JSON không hợp lệ.");
    }
  };

  const resetAll = () => {
    resetConfig();
    toast.success("Đã reset về mặc định.");
  };

  // Render input theo type
  const renderEditor = (row: ConfigRowDef) => {
    const k = row.key as string;
    const v = draft?.[k];

    switch (row.type) {
      case "boolean":
        return (
          <div className="flex items-center gap-2">
            <Switch checked={!!v} onCheckedChange={(val) => updateDraft(k, val)} />
            <span className="text-xs text-muted-foreground">{v ? "On" : "Off"}</span>
          </div>
        );

      case "number":
      case "percent":
        return (
          <Input
            type="number"
            inputMode="numeric"
            value={v ?? 0}
            min={row.min}
            max={row.max}
            step={row.step ?? (row.type === "percent" ? 1 : 1)}
            onChange={(e) => {
              const num = Number(e.target.value || 0);
              // clamp
              const clamped =
                row.type === "percent"
                  ? clamp(num, 0, 100)
                  : clamp(num, row.min ?? Number.MIN_SAFE_INTEGER, row.max ?? Number.MAX_SAFE_INTEGER);
              updateDraft(k, clamped);
            }}
          />
        );

      case "json":
        return (
          <Input
            value={safeJSONString(v)}
            onChange={(e) => {
              const txt = e.target.value;
              try {
                const parsed = JSON.parse(txt);
                updateDraft(k, parsed);
              } catch {
                // giữ nguyên text, nhưng bạn có thể thêm validation UI nếu muốn
                updateDraft(k, txt);
              }
            }}
          />
        );

      default:
        return (
          <Input
            value={String(v ?? "")}
            onChange={(e) => updateDraft(k, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="p-4 md:p-8">
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            {/* <CardTitle className="text-base md:text-lg">System Config</CardTitle>
            <p className="text-xs text-muted-foreground">
              FE-only config • Inline edit • Tìm kiếm • Lọc nhóm • Phân trang • Import/Export JSON
            </p> */}
          </div>

          <div className="flex items-center gap-2">
            {/* <Button variant="outline" onClick={exportJSON}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button variant="outline" onClick={importJSON}>
              <Upload className="h-4 w-4 mr-2" /> Import
            </Button> */}
            <Button variant="outline" onClick={() => setOpenResetConfirm(true)}>
              <RefreshCw className="h-4 w-4 mr-2" /> Reset
            </Button>
            <Button onClick={saveAll}>
              <Save className="h-4 w-4 mr-2" /> Lưu thay đổi
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Tìm theo key, label, mô tả…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground hidden md:inline">Nhóm</span>
              </div>
              <Select value={group} onValueChange={(v: any) => { setGroup(v); setPage(1); }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Chọn nhóm" />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_OPTIONS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="h-4 w-4" />
                Đang hiển thị {paged.length} / {rows.length} (tổng {CONFIG_DEFS.length})
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[240px]">Key</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead className="w-[140px] text-center">Group</TableHead>
                  <TableHead className="w-[120px] text-center">Type</TableHead>
                  <TableHead className="w-[280px]">Value</TableHead>
                  <TableHead>Mô tả</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((r) => (
                  <TableRow key={r.key as string}>
                    <TableCell className="font-mono text-xs">{r.key as string}</TableCell>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell className="text-center">
                      <GroupBadge g={r.group} />
                    </TableCell>
                    <TableCell className="text-center">
                      <TypeBadge t={r.type} />
                    </TableCell>
                    <TableCell>{renderEditor(r)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.description ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm py-8 text-muted-foreground">
                      Không có cấu hình phù hợp bộ lọc.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">
              Trang {page}/{totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={openResetConfirm} onOpenChange={setOpenResetConfirm}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận reset</AlertDialogTitle>
            <AlertDialogDescription>
                Tất cả các thay đổi sẽ được reset lại thành default. Bạn có chắc chắn muốn tiếp tục?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
                onClick={() => {
                resetAll();           // hàm bạn đã có: resetConfig() + toast.success(...)
                setOpenResetConfirm(false);
                }}
            >
                Đồng ý
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}

/* ========= 4) Utils ========= */

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function safeJSONString(v: any) {
  try {
    if (typeof v === "string") JSON.parse(v); // nếu v đang là text JSON, thử parse để check valid
    return typeof v === "string" ? v : JSON.stringify(v ?? {});
  } catch {
    return typeof v === "string" ? v : JSON.stringify(v ?? {});
  }
}

function coerceByType(v: any, t: FieldType) {
  try {
    switch (t) {
      case "boolean": return !!(v === true || v === "true" || v === 1 || v === "1");
      case "number": return Number(v ?? 0);
      case "percent": {
        const n = Number(v ?? 0);
        return clamp(n, 0, 100);
      }
      case "json":
        return typeof v === "string" ? JSON.parse(v) : v ?? {};
      default:
        return String(v ?? "");
    }
  } catch {
    return t === "json" ? {} : v;
  }
}
