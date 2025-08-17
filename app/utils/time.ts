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
