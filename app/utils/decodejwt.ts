import { jwtDecode } from "jwt-decode";

/**
 * JWT claims for HRM-AI tokens.
 * Matches your payload and keeps room for extra provider-specific claims.
 */
export interface JwtClaims {
  accountId: string;           
  accountEmail: string;          
  deviceId: string;              
  jti: string;                    
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": string | string[];
  exp: number;                     
  iss: "HRM-AI" | string;
  aud: "HRM-AI" | string;
  iat?: number;
  nbf?: number;
  sub?: string;
  [k: string]: unknown;
}

/** SSR-safe getter for the token from localStorage. */
export function getAccessTokenFromStorage(key = "accessToken"): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Decode without verifying the signature (client-side use only). */
export function decodeAccessToken<T extends object = JwtClaims>(
  token: string | null | undefined
): T | null {
  if (!token) return null;
  try {
    return jwtDecode<T>(token);
  } catch {
    return null;
  }
}

/** Role helpers */
export function getRoles(claims?: JwtClaims | null): string[] {
  if (!claims) return [];
  const raw =
    claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
}

export function hasRole(claims: JwtClaims | null | undefined, role: string) {
  return getRoles(claims).some((r) => r.toLowerCase() === role.toLowerCase());
}

/** Expiry helpers */
export function isExpired(exp?: number | null): boolean {
  if (!exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return exp <= now;
}

export function secondsUntilExpiry(exp?: number | null): number | null {
  if (!exp) return null;
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, exp - now);
}
