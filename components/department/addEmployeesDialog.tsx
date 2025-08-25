"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search } from "lucide-react";
import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";
import { CheckedState } from "@radix-ui/react-checkbox";

function fullName(a: Account) {
  return [a.firstName, a.lastName].filter(Boolean).join(" ").trim() || "—";
}

export default function AddEmployeesDialog({
  departmentId,
  open,
  onOpenChange,
  onAdded,
}: {
  departmentId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdded: () => void; // e.g. router.refresh
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ("");
    setSelected({});
    setLoading(true);
    authFetch(`${API.ACCOUNT.BASE}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
        const json = await res.json();
        const arr = Array.isArray(json) ? json : (json?.data ?? []).filter((a : any) => a.departmentId == null);
        console.log("list account " + arr)
        setAccounts(arr as Account[]);
      })
      .catch((err) => {
        toast({ title: "Failed to load accounts", description: String(err), variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [open]); 

  const filtered = useMemo(() => {
    if (!q.trim()) return accounts;
    const needle = q.toLowerCase();
    return accounts.filter((a) =>
      [a.email, fullName(a), a.phoneNumber].some((t) => (t ?? "").toLowerCase().includes(needle))
    );
  }, [q, accounts]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((a) => selected[a.id]);
  const someVisibleSelected = filtered.some((a) => selected[a.id]);

  const toggleAllVisible = (checked: boolean) => {
    const next = { ...selected };
    filtered.forEach((a) => {
      next[a.id] = checked;
    });
    setSelected(next);
  };

  const countSelected = Object.values(selected).filter(Boolean).length;

  const handleSubmit = async () => {
    if (countSelected === 0) {
      toast({ title: "Please select at least one account." });
      return;
    }
    setSubmitting(true);
    try {
      const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
      const url = `${API.ACCOUNT.ADD_TO_DEPARTMENT}?departmentId=${encodeURIComponent(departmentId)}`;
      const res = await authFetch(url, {
        method: "PUT",
        body: JSON.stringify(ids),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }
      toast({ title: "Nhân viên đã được thêm vào", description: `${ids.length} tài khoản được thêm vào phòng ban.` });
      onOpenChange(false);
      onAdded(); // e.g. router.refresh()
    } catch (err) {
      toast({ title: "Thêm không thành công", description: String(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const headerState: CheckedState =
  allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm nhân viên</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, email, số điện thoại…"
              className="pl-8"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              disabled={loading}
            />
          </div>
          <Badge variant="secondary" className="whitespace-nowrap">
            {countSelected} đã chọn
          </Badge>
        </div>

        <div className="rounded-md border">
          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <Checkbox
                checked={headerState}
                onCheckedChange={(v) => {
                    const next = v === true || v === "indeterminate";
                    toggleAllVisible(next);
                }}
                aria-label="Select all"
            />
            <span className="text-sm text-muted-foreground">Chọn tất cả</span>
          </div>

          <ScrollArea className="h-80">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading accounts…
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-8 text-sm text-muted-foreground">Không tìm thấy tài khoản nào.</div>
            ) : (
              <ul className="divide-y">
                {filtered.map((a) => {
                  const id = a.id;
                  const isChecked = !!selected[id];
                  return (
                    <li key={id} className="flex items-center gap-3 px-3 py-2">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(v) =>
                          setSelected((s) => ({ ...s, [id]: Boolean(v) }))
                        }
                        aria-label={`Select ${fullName(a)}`}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{fullName(a)}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.email || "—"} {a.phoneNumber ? ` • ${a.phoneNumber}` : ""}
                        </div>
                      </div>                                            
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || countSelected === 0}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Thêm {countSelected > 0 ? `(${countSelected})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
