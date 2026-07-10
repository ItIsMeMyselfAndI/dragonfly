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
import { UserSettings, DEFAULT_USER_SETTINGS } from "@/lib/settings/types";
import { getUserSettings, saveUserSettings } from "@/lib/settings/client";
import { useAuth } from "@/features/auth/store";

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

const Ctx = createContext<SettingsStore | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [defaultProvider, setProvider] = useState<ProviderType>(
    DEFAULT_USER_SETTINGS.defaultProvider,
  );
  const [defaultModel, setModel] = useState<string>(
    DEFAULT_USER_SETTINGS.defaultModel,
  );
  const [notificationsEnabled, setNotifications] = useState(
    DEFAULT_USER_SETTINGS.notificationsEnabled,
  );

  // Load persisted settings for signed-in users. Guests have no stored
  // settings, so they reset to the in-memory defaults.
  useEffect(() => {
    let active = true;
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProvider(DEFAULT_USER_SETTINGS.defaultProvider);
      setModel(DEFAULT_USER_SETTINGS.defaultModel);
      setNotifications(DEFAULT_USER_SETTINGS.notificationsEnabled);
      return;
    }
    getUserSettings()
      .then((settings: UserSettings) => {
        if (!active) return;
        setProvider(settings.defaultProvider);
        setModel(settings.defaultModel);
        setNotifications(settings.notificationsEnabled);
      })
      .catch(() => {
        /* keep defaults on failure */
      });
    return () => {
      active = false;
    };
  }, [user]);

  const setDefaultProvider = useCallback(
    (provider: ProviderType) => {
      const models = MODELS_BY_PROVIDER[provider];
      const nextModel = models.includes(defaultModel)
        ? defaultModel
        : models[0];
      setProvider(provider);
      setModel(nextModel);
      if (user) {
        void saveUserSettings({
          defaultProvider: provider,
          defaultModel: nextModel,
          notificationsEnabled,
        }).catch(() => {});
      }
    },
    [user, defaultModel, notificationsEnabled],
  );

  const setDefaultModel = useCallback(
    (model: string) => {
      setModel(model);
      if (user) {
        void saveUserSettings({
          defaultProvider,
          defaultModel: model,
          notificationsEnabled,
        }).catch(() => {});
      }
    },
    [user, defaultProvider, notificationsEnabled],
  );

  const setNotificationsEnabled = useCallback(
    (value: boolean) => {
      setNotifications(value);
      if (user) {
        void saveUserSettings({
          defaultProvider,
          defaultModel,
          notificationsEnabled: value,
        }).catch(() => {});
      }
    },
    [user, defaultProvider, defaultModel],
  );

  const value = useMemo<SettingsStore>(
    () => ({
      defaultProvider,
      defaultModel,
      notificationsEnabled,
      setDefaultProvider,
      setDefaultModel,
      setNotificationsEnabled,
    }),
    [
      defaultProvider,
      defaultModel,
      notificationsEnabled,
      setDefaultProvider,
      setDefaultModel,
      setNotificationsEnabled,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSettings must be used within SettingsProvider");
  return v;
}
