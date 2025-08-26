// lib/auth.ts

export enum Role {
  HR = 1,
  DeparmentManager = 2, // [sic] keep as-is to match backend
  Employee = 3,
  Admin = 4,
}

type StoredRole = { name: string; role: number };

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Preferred: use numeric "roleIds"; fallback: map from "roles" array */
export function getRoleIds(): number[] {
  const ids = parseJSON<number[]>(safeGet("roleIds"), []);
  if (ids.length) return ids;

  const roles = parseJSON<StoredRole[]>(safeGet("roles"), []);
  return roles.map((r) => r.role);
}

export function getRoles(): StoredRole[] {
  return parseJSON<StoredRole[]>(safeGet("roles"), []);
}

export function hasRoleId(roleId: Role): boolean {
  return getRoleIds().includes(roleId);
}

export function hasAnyRole(roleIds: Role[]): boolean {
  const owned = new Set(getRoleIds());
  return roleIds.some((r) => owned.has(r));
}

// Single-role checks
export const isHR = () => hasRoleId(Role.HR);
export const isDepartmentManager = () => hasRoleId(Role.DeparmentManager);
export const isAdmin = () => hasRoleId(Role.Admin);

// Combined-role checks
export const isHRorDM = () => hasAnyRole([Role.HR, Role.DeparmentManager]);
export const isHRorDMorAdmin = () =>
  hasAnyRole([Role.HR, Role.DeparmentManager, Role.Admin]);

const roleLabel: Record<number, string> = {
  [Role.HR]: "HR",
  [Role.DeparmentManager]: "Department Manager",
  [Role.Employee]: "Employee",
  [Role.Admin]: "Admin",
};

export function getRoleLabels(): string[] {
  return getRoleIds().map((id) => roleLabel[id] ?? `Role ${id}`);
}

export function getPrimaryRoleLabel(): string | null {
  const labels = getRoleLabels();
  return labels[0] ?? null;
}
