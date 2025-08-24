// src/utils/dateHelpers.ts

/**
 * Convert "YYYY-MM-DD" from <input type="date"> to ISO string "YYYY-MM-DDT00:00:00.000Z".
 * If already in ISO format, returns it unchanged.
 */
export const toIsoFromDateInput = (d?: string | null): string | null => {
  if (!d) return null;
  if (/\dT\d/.test(d)) return d; // already ISO-like
  return new Date(`${d}T00:00:00`).toISOString();
};

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
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10); // yyyy-mm-dd
};