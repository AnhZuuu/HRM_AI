// src/utils/dateHelpers.ts

/**
 * Convert "YYYY-MM-DD" from <input type="date"> to ISO string "YYYY-MM-DDT00:00:00.000Z".
 * If already in ISO format, returns it unchanged.
 */

/**
 * Parse a variety of date strings safely into a Date object.
 * Accepts plain "YYYY-MM-DD" and full ISO strings.
 */
export const toDate = (s?: string | null): Date | null => {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00`);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Format a date string into "DD-MM-YYYY HH:mm" in local time.
 * Returns "—" if input is null or invalid.
 */
export const formatDMYHM = (s?: string | null): string => {
  const d = toDate(s);
  if (!d) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}:${mi}`;
};

/**
 * Formats an ISO date string into `dd/MM/yyyy` format.
 *
 * Example:
 * formatISODate("2025-08-31T17:00:00Z"); // "31/08/2025"
 * formatISODate(undefined); // "—"
 */
export const formatISODate = (iso?: string) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    // return `${yyyy}-${mm}-${dd}`;
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return "—";
  }
};

export const toIsoFromDateInput = (dateStr: string | null) => {
  if (!dateStr) return null;
  // "2025-08-28" -> new Date(2025, 7, 28) (local time, no timezone shift)
  const [y, m, d] = dateStr.split("-").map(Number);
  const local = new Date(y, m - 1, d); 
  return local.toISOString(); // "2025-08-27T17:00:00.000Z" if you log in VN, but still correct date part
}
export const toLocalDateIso = (dateStr: string | null) => {
  if (!dateStr) return null;
  return `${dateStr}T00:00:00+07:00`; // force Vietnam midnight
}



export const toMidnight = (d: string | Date) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

export const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export const nowVietnamLocal = () => {
  const now = new Date();
  // Lấy giờ hiện tại của máy tính, rồi ép sang VN timezone
  const vnDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));

  const year = vnDate.getFullYear();
  const month = String(vnDate.getMonth() + 1).padStart(2, "0");
  const day = String(vnDate.getDate()).padStart(2, "0");
  const hours = String(vnDate.getHours()).padStart(2, "0");
  const minutes = String(vnDate.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`; // yyyy-MM-ddTHH:mm
}

export const  formatDOB = (dateStr?: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Generates initials from a person's first and last name.
 * Trims whitespace to avoid " " when no data.
 */
export const  initials = (first?: string, last?: string) => {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "U";
}

/**
 * Copies the provided text to the user's clipboard.
 * */
 export const  copy = async(text: string) =>{
  try { await navigator.clipboard.writeText(text); } catch {}
}

export const toDateInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10); 
};

export const fmtVnd = (n?: number | null) => {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
  } catch {
    return `${n} VND`;
  }
}

export const fmtDate = (s?: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

