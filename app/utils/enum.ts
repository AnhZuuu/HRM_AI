export const genderLabel: Record<number, string> = { 0: "Female", 1: "Male", 2: "Other" };

export type RoleOption = { value: number; label: string };
export const ROLE_OPTIONS: RoleOption[] = [
  { value: 1, label: "HR" },
  { value: 2, label: "Department Manager" },
  { value: 3, label: "Employee" },
  { value: 4, label: "Admin" },
];