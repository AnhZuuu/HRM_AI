"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ConfigSchema, DEFAULT_CONFIG, CONFIG_STORAGE_KEY, type ConfigShape } from "./configKeys";

type Ctx = {
  config: ConfigShape;
  setConfig: (updater: Partial<ConfigShape>) => void;
  resetConfig: () => void;
};
const ConfigContext = createContext<Ctx | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<ConfigShape>(DEFAULT_CONFIG);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const safe = ConfigSchema.parse({
          ...DEFAULT_CONFIG,
          ...parsed,
        });
        setConfigState(safe);
      }
    } catch {}
  }, []);

  const setConfig = (updater: Partial<ConfigShape>) => {
    setConfigState(prev => {
      const merged = { ...prev, ...updater };
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    });
  };

  const resetConfig = () => {
    setConfigState(DEFAULT_CONFIG);
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
  };

  const value = useMemo(() => ({ config, setConfig, resetConfig }), [config]);
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within <ConfigProvider>");
  return ctx;
}

/** Convenience hook: lấy nhiều key một lúc */
export function useSystemConfig<K extends keyof ConfigShape>(keys: K[]) {
  const { config } = useConfig();
  const selected = {} as Pick<ConfigShape, K>;
  keys.forEach(k => (selected[k] = config[k]));
  return selected;
}
