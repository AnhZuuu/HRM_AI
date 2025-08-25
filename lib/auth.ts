// lib/auth.ts

export enum Role {
  HR = 1,
  DeparmentManager = 2, // [sic] keep as-is to match backend
  Employee = 3,
  Admin = 4,
}

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Reads numeric role IDs from localStorage.
 * Falls back to parsing "roles" array if "roleIds" is missing.
 */
export function getRoleIds(): number[] {
  // Preferred: precomputed numeric IDs
  const rawIds = safeGet("roleIds");
  if (rawIds) {
    try {
      return JSON.parse(rawIds) as number[];
    } catch {
      // ignore and try fallback
    }
  }

  // Fallback: map from full roles array
  const rawRoles = safeGet("roles");
  if (rawRoles) {
    try {
      const roles = JSON.parse(rawRoles) as Array<{ name: string; role: number }>;
      return roles.map(r => r.role);
    } catch {
      // ignore
    }
  }

  return [];
}

export function hasRoleId(roleId: Role): boolean {
  return getRoleIds().includes(roleId);
}

export function hasAnyRole(roleIds: Role[]): boolean {
  const owned = new Set(getRoleIds());
  return roleIds.some(r => owned.has(r));
}

// Single-role checks
export const isHR = () => hasRoleId(Role.HR);
export const isDepartmentManager = () => hasRoleId(Role.DeparmentManager);
export const isAdmin = () => hasRoleId(Role.Admin);

// Combined-role checks
export const isHRorDM = () => hasAnyRole([Role.HR, Role.DeparmentManager]);
export const isHRorDMorAdmin = () =>
  hasAnyRole([Role.HR, Role.DeparmentManager, Role.Admin]);
