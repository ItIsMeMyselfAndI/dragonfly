"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ProviderType } from "@/lib/ai/types";

export const PROVIDER_OPTIONS: { value: ProviderType; label: string }[] = [
  { value: ProviderType.GEMINI, label: "Gemini" },
  { value: ProviderType.OPENAI, label: "OpenAI" },
  { value: ProviderType.OPENROUTER, label: "OpenRouter" },
  { value: ProviderType.CHATGPT, label: "ChatGPT" },
];

export const MODELS_BY_PROVIDER: Record<ProviderType, string[]> = {
  [ProviderType.GEMINI]: ["gemini-2.5-flash-lite", "gemini-2.0-flash"],
  [ProviderType.OPENAI]: ["gpt-4o", "gpt-4", "gpt-3.5-turbo"],
  [ProviderType.OPENROUTER]: [
    "openai/gpt-4o",
    "openai/gpt-4",
    "anthropic/claude-3.5-sonnet",
    "google/gemini-2.0-flash",
  ],
  [ProviderType.CHATGPT]: ["gpt-4o", "gpt-4", "gpt-3.5-turbo"],
};

interface SettingsStore {
  defaultProvider: ProviderType;
  defaultModel: string;
  notificationsEnabled: boolean;
  setDefaultProvider: (provider: ProviderType) => void;
  setDefaultModel: (model: string) => void;
  setNotificationsEnabled: (value: boolean) => void;
}

const STORAGE_KEY = "dragonfly-settings";

function loadSettings(): Partial<SettingsStore> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<SettingsStore>) : {};
  } catch {
    return {};
  }
}

const Ctx = createContext<SettingsStore | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [defaultProvider, setProvider] = useState<ProviderType>(
    ProviderType.GEMINI,
  );
  const [defaultModel, setModel] = useState<string>("gemini-2.5-flash-lite");
  const [notificationsEnabled, setNotifications] = useState(true);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = loadSettings();
    if (saved.defaultProvider) setProvider(saved.defaultProvider);
    if (saved.defaultModel) setModel(saved.defaultModel);
    if (typeof saved.notificationsEnabled === "boolean") {
      setNotifications(saved.notificationsEnabled);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ defaultProvider, defaultModel, notificationsEnabled }),
      );
    } catch {
      // ignore persistence errors
    }
  }, [defaultProvider, defaultModel, notificationsEnabled]);

  const setDefaultProvider = useCallback((provider: ProviderType) => {
    setProvider(provider);
    const models = MODELS_BY_PROVIDER[provider];
    setModel((prev) => (models.includes(prev) ? prev : models[0]));
  }, []);

  const value = useMemo<SettingsStore>(
    () => ({
      defaultProvider,
      defaultModel,
      notificationsEnabled,
      setDefaultProvider,
      setDefaultModel: setModel,
      setNotificationsEnabled: setNotifications,
    }),
    [
      defaultProvider,
      defaultModel,
      notificationsEnabled,
      setDefaultProvider,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSettings must be used within SettingsProvider");
  return v;
}
