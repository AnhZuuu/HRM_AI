export const generateTimeSlots = (start = 8, end = 18, interval = 15) => {
  const slots: string[] = [];
  for (let h = start; h <= end; h++) {
    for (let m = 0; m < 60; m += interval) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
};

export function fmtRange(start?: string | null, end?: string | null, locale = "vi-VN") {
  if (!start) return "—";
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const d = s.toLocaleDateString(locale);
  const t1 = s.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const t2 = e ? e.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) : null;
  return t2 ? `${d} ${t1}–${t2}` : `${d} ${t1}`;
}


export const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
// utils/time.ts (client-only or in a 'use client' module)
export function todayStartVNForDatetimeLocal(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (t: string) => parts.find(p => p.type === t)?.value ?? "";
  const y = get("year");
  const m = get("month");
  const d = get("day");
  return `${y}-${m}-${d}T00:00`;
}

