"use client";

import { useEffect, useState } from "react";
import { decodeAccessToken, getAccessTokenFromStorage, isExpired, type JwtClaims } from "@/app/utils/decodejwt";

export function useDecodedToken(storageKey = "accessToken") {
  const [claims, setClaims] = useState<JwtClaims | null>(null);

  useEffect(() => {
    const token = getAccessTokenFromStorage(storageKey);
    const decoded = decodeAccessToken(token);
    setClaims(decoded ?? null);
  }, [storageKey]);

  const expired = isExpired(claims?.exp);
  return { claims, expired };
}
