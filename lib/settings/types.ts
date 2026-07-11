import { ProviderType } from "@/lib/ai/types";

export interface UserSettings {
  defaultProvider: ProviderType;
  defaultModel: string;
  notificationsEnabled: boolean;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  defaultProvider: ProviderType.GEMINI,
  defaultModel: "gemini-2.5-flash-lite",
  notificationsEnabled: true,
};
