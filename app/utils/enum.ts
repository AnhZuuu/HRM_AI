export const genderLabel: Record<number, string> = { 0: "Female", 1: "Male", 2: "Other" };

export type RoleOption = { value: number; label: string };
export const ROLE_OPTIONS: RoleOption[] = [
  { value: 1, label: "HR" },
  { value: 2, label: "Department Manager" },
  { value: 3, label: "Employee" },
  { value: 4, label: "Admin" },
];
export const ROLE_MAP_COLOR: Record<number, { label: string; className: string }> = {
  1: { label: "HR", className: "bg-indigo-100 text-indigo-700" },
  2: { label: "Department Manager", className: "bg-amber-100 text-amber-700" },
  3: { label: "Employee", className: "bg-sky-100 text-sky-700" },
  4: { label: "Admin", className: "bg-rose-100 text-rose-700" },
};

export const SalaryTpe: Record<number, string> = { 0: "Net", 1: "Gross"};
export const OnboardRequestStatus: Record<number, string> = { 0: "Pending", 1: "Approved", 2: "Rejected", 3: "Cancelled", 4: "Completed" };
export const statusColor: Record<number, string> = {
  0: "bg-amber-100 text-amber-800 border-amber-200",
  1: "bg-emerald-100 text-emerald-800 border-emerald-200",
  2: "bg-rose-100 text-rose-800 border-rose-200",
  3: "bg-slate-200 text-slate-700 border-slate-300",
  4: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

export const OUTCOME_STATUS: Record<number, { label: string; className: string }> = {
  0: { label: "Pending", className: "bg-slate-100 text-slate-700" },
  1: { label: "Pass",    className: "bg-emerald-100 text-emerald-700" },
  2: { label: "Fail",    className: "bg-rose-100 text-rose-700" },
};

export const INTERVIEW_STATUS_MAP: Record<number, { label: string; className: string }> = {
  0: { label: "Scheduled", className: "bg-blue-100 text-blue-700" },
  1: { label: "Completed", className: "bg-emerald-100 text-emerald-700" },
  2: { label: "Canceled", className: "bg-rose-100 text-rose-700" },
};