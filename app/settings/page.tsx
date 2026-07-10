"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Sun, Moon, KeyRound, Plus, X, Eye, EyeOff } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { InfoTooltip } from "@/components/InfoTooltip";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import {
  useSettings,
  PROVIDER_OPTIONS,
  MODELS_BY_PROVIDER,
} from "@/features/settings/store";
import { useAuth } from "@/features/auth/store";
import { useInspire } from "@/features/inspire/store";
import { useNavigationGuard } from "@/components/navigation/NavigationGuard";
import { cn } from "@/lib/utils";
import {
  getRateLimitStatus,
  type RateLimitStatus,
} from "@/lib/rate-limit/client";
import {
  getApiKeys,
  saveApiKeys,
  type UserApiKeys,
} from "@/lib/settings/client";
import { ProviderType } from "@/lib/ai/types";
import { getProviderAvailability } from "@/lib/ai/availabilityClient";

const API_KEY_PROVIDERS: { provider: ProviderType; label: string }[] = [
  { provider: ProviderType.GEMINI, label: "Gemini" },
  { provider: ProviderType.OPENAI, label: "OpenAI" },
  { provider: ProviderType.OPENROUTER, label: "OpenRouter" },
  { provider: ProviderType.CHATGPT, label: "ChatGPT" },
];

function Card({
  title,
  description,
  headerRight,
  children,
}: {
  title: string;
  description?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-surface/60 p-4 ring-1 ring-white/5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { isGuest } = useAuth();
  const router = useRouter();
  const { fetchRateLimitStatus } = useInspire();
  const {
    defaultProvider,
    defaultModel,
    notificationsEnabled,
    setDefaultProvider,
    setDefaultModel,
    setNotificationsEnabled,
  } = useSettings();

  const [mounted, setMounted] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimitStatus | null>(null);
  const [keys, setKeys] = useState<UserApiKeys>({});
  const [useOwnKeys, setUseOwnKeys] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [savingKeys, setSavingKeys] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);
  const [baselineKeys, setBaselineKeys] = useState<UserApiKeys>({});
  const [baselineUseOwnKeys, setBaselineUseOwnKeys] = useState(false);
  const [appAvailable, setAppAvailable] = useState<Record<
    ProviderType,
    boolean
  > | null>(null);
  const warnedProviderRef = useRef<ProviderType | null>(null);

  const [localProvider, setLocalProvider] = useState<ProviderType>(
    defaultProvider,
  );
  const [localModel, setLocalModel] = useState<string>(defaultModel);
  const [localTheme, setLocalTheme] = useState<"dark" | "light">("dark");
  const [localNotifications, setLocalNotifications] = useState(
    notificationsEnabled,
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (theme) setLocalTheme(theme as "dark" | "light");
  }, [theme]);

  useEffect(() => {
    setLocalNotifications(notificationsEnabled);
  }, [notificationsEnabled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    getRateLimitStatus()
      .then(setRateLimit)
      .catch(() => setRateLimit(null));
    if (!isGuest) {
      getApiKeys()
        .then((res) => {
          setKeys(res.keys);
          setUseOwnKeys(res.enabled);
          setBaselineKeys(res.keys);
          setBaselineUseOwnKeys(res.enabled);
        })
        .catch(() => {
          setKeys({});
          setUseOwnKeys(false);
        });
    }
  }, [isGuest]);

  useEffect(() => {
    getProviderAvailability()
      .then(setAppAvailable)
      .catch(() => setAppAvailable(null));
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (params.get("section") === "keys") setKeysOpen(true);
    }
  }, []);

  // Keep the local draft in sync when the persisted store value changes
  // (e.g. when the provider/model is loaded from Supabase on mount).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalProvider(defaultProvider);
    setLocalModel(defaultModel);
  }, [defaultProvider, defaultModel]);

  function providerLabel(provider: ProviderType): string {
    return PROVIDER_OPTIONS.find((o) => o.value === provider)?.label ?? provider;
  }

  function isProviderEnabled(provider: ProviderType): boolean {
    const app = appAvailable?.[provider] ?? false;
    const own =
      useOwnKeys &&
      (keys[provider] ?? []).some((v) => v && v.trim().length > 0);
    return app || own;
  }

  useEffect(() => {
    if (appAvailable === null) return;
    if (!isProviderEnabled(defaultProvider)) {
      if (warnedProviderRef.current !== defaultProvider) {
        warnedProviderRef.current = defaultProvider;
        toast.error(
          `Your default provider "${providerLabel(
            defaultProvider,
          )}" is unavailable. Add your own API keys or choose another provider.`,
          {
            duration: Infinity,
            closeButton: false,
            action: {
              label: "Manage API keys",
              onClick: () => {
                setKeysOpen(true);
                router.push("/settings?section=keys");
              },
            },
          },
        );
      }
    } else {
      warnedProviderRef.current = null;
    }
  }, [appAvailable, defaultProvider, useOwnKeys, keys, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDark = mounted ? localTheme === "dark" : true;

  async function handleSaveKeys() {
    setSavingKeys(true);
    try {
      await saveApiKeys(keys, useOwnKeys);
      setBaselineKeys(keys);
      setBaselineUseOwnKeys(useOwnKeys);
      // Refresh the global rate-limit status so the home page reflects the
      // new unlimited state immediately (it reads rateLimitStatus.unlimited).
      void fetchRateLimitStatus();
      toast.success(
        useOwnKeys
          ? "Saved. Your generation limit is now removed."
          : "Saved. Using app API keys.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save API keys");
    } finally {
      setSavingKeys(false);
    }
  }

  const isKeysDirty =
    JSON.stringify(keys) !== JSON.stringify(baselineKeys) ||
    useOwnKeys !== baselineUseOwnKeys;

  const hasAnyKey = Object.values(keys).some((arr) =>
    (arr ?? []).some((v) => v && v.trim().length > 0),
  );

  const allKeysVisible =
    hasAnyKey &&
    API_KEY_PROVIDERS.every(({ provider }) =>
      (keys[provider] ?? []).every((_, i) => visibleKeys[`${provider}-${i}`]),
    );

  function toggleAllKeys() {
    const next = !allKeysVisible;
    setVisibleKeys((prev) => {
      const copy = { ...prev };
      API_KEY_PROVIDERS.forEach(({ provider }) => {
        (keys[provider] ?? []).forEach((_, i) => {
          copy[`${provider}-${i}`] = next;
        });
      });
      return copy;
    });
  }

  async function handleSaveProvider() {
    setDefaultProvider(localProvider);
    setDefaultModel(localModel);
    toast.success("Provider settings saved.");
  }

  const currentTheme = (theme ?? "dark") as "dark" | "light";
  const isPreferencesDirty =
    localTheme !== currentTheme || localNotifications !== notificationsEnabled;

  async function handleSavePreferences() {
    setTheme(localTheme);
    setNotificationsEnabled(localNotifications);
    toast.success("Preferences saved.");
  }

  async function saveAllChanges() {
    if (localProvider !== defaultProvider || localModel !== defaultModel) {
      handleSaveProvider();
    }
    if (isPreferencesDirty) {
      handleSavePreferences();
    }
    if (isKeysDirty) {
      setSavingKeys(true);
      try {
        await saveApiKeys(keys, useOwnKeys);
        setBaselineKeys(keys);
        setBaselineUseOwnKeys(useOwnKeys);
        void fetchRateLimitStatus();
      } finally {
        setSavingKeys(false);
      }
    }
  }

  function discardChanges() {
    setLocalProvider(defaultProvider);
    setLocalModel(defaultModel);
    setLocalTheme(currentTheme);
    setLocalNotifications(notificationsEnabled);
    setKeys(baselineKeys);
    setUseOwnKeys(baselineUseOwnKeys);
  }

  useNavigationGuard({
    isDirty: () =>
      isKeysDirty ||
      localProvider !== defaultProvider ||
      localModel !== defaultModel ||
      isPreferencesDirty,
    onSave: saveAllChanges,
    onDiscard: discardChanges,
  });

  return (
    <div className="flex flex-col gap-4 px-5 pt-2 pb-32">
      <PageHeader trail={[{ label: "Settings" }]} />

      <Card
        title="Preferences"
        description="App-wide appearance and alerts."
        headerRight={
          <Button
            onClick={handleSavePreferences}
            disabled={!isPreferencesDirty}
          >
            Save
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Sun className="size-4 text-muted-foreground" />
              <span>Theme</span>
              <Moon className="size-4 text-muted-foreground" />
            </div>
            <Switch
              checked={isDark}
              onCheckedChange={(v) => setLocalTheme(v ? "dark" : "light")}
              aria-label="Toggle theme"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Notifications</span>
            <Switch
              checked={localNotifications}
              onCheckedChange={setLocalNotifications}
              aria-label="Toggle notifications"
            />
          </div>
        </div>
      </Card>

      <Card
        title="AI Provider & Model"
        description="Choose the default provider used for generation."
        headerRight={
          <InfoTooltip text="The selected provider and model are used for every generation. When you generate a project, these values are sent with the request so the AI uses your chosen provider and model for the specs, BOM, and visual flow. Pick your own API keys to override the app's provider quota." />
        }
      >
        <div className="flex flex-wrap gap-3">
          <div className="flex min-w-[160px] flex-1 flex-col gap-3">
            <Label htmlFor="set-provider">Provider</Label>
            <Select
              value={localProvider}
              onValueChange={(v) => {
                const next = v as ProviderType;
                setLocalProvider(next);
                if (!MODELS_BY_PROVIDER[next].includes(localModel)) {
                  setLocalModel(MODELS_BY_PROVIDER[next][0]);
                }
              }}
            >
              <SelectTrigger id="set-provider">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    disabled={!isProviderEnabled(opt.value)}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-w-[160px] flex-1 flex-col gap-3">
            <Label htmlFor="set-model">Model</Label>
            <Select
              value={localModel}
              onValueChange={setLocalModel}
            >
              <SelectTrigger id="set-model">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {MODELS_BY_PROVIDER[localProvider].map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            onClick={handleSaveProvider}
            disabled={
              !isProviderEnabled(localProvider) ||
              (localProvider === defaultProvider &&
                localModel === defaultModel)
            }
          >
            Save
          </Button>
        </div>
      </Card>

      <Card
        title="API Usage"
        description="Your remaining generations for today."
        headerRight={
          <InfoTooltip text="Guests get 3 generations per day, signed-in users get 5, and you get unlimited generations when using your own API keys." />
        }
      >
        {rateLimit ? (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-medium">
                {useOwnKeys && hasAnyKey ? (
                  <span className="text-success">Unlimited</span>
                ) : (
                  <>
                    {rateLimit.remaining} / {rateLimit.limit}
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">
                {rateLimit.isGuest ? "Guest" : "Signed in"}
              </span>
            </div>
            {useOwnKeys && hasAnyKey ? (
              <p className="mt-1 text-xs text-success">
                Unlimited — using your own API keys.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Unable to load usage.</p>
        )}
      </Card>

      <section className="rounded-2xl bg-surface/60 p-4 ring-1 ring-white/5">
        <Collapsible open={keysOpen} onOpenChange={setKeysOpen}>
        <CollapsibleTrigger className="flex w-full items-start justify-between gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">API Keys</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Add your own keys to remove the daily generation limit. You stay
              bound by your provider&apos;s own quota.
            </p>
          </div>
          <ChevronDown
            className={cn(
              "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
              keysOpen && "rotate-180",
            )}
          />
        </CollapsibleTrigger>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={useOwnKeys}
              onCheckedChange={setUseOwnKeys}
              aria-label="Use your own API keys"
            />
            <span className="text-xs text-muted-foreground">
              {useOwnKeys ? "Your own keys" : "App API keys"}
            </span>
          </div>
          <div className="relative ml-auto">
            <InfoTooltip text="You can only remove the generation limit when you switch to your own API keys." />
          </div>
        </div>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          {isGuest ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Sign in to add your own API keys and lift the generation limit.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              {useOwnKeys && hasAnyKey && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleAllKeys}
                    aria-label={
                      allKeysVisible ? "Hide all keys" : "Show all keys"
                    }
                    className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-surface-elevated hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {allKeysVisible ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {allKeysVisible ? "Hide all keys" : "Show all keys"}
                  </span>
                </div>
              )}
              {!useOwnKeys ? (
                <p className="text-xs text-muted-foreground">
                  Toggle on &ldquo;Your own keys&rdquo; above to add API keys and
                  lift the generation limit.
                </p>
              ) : (
                API_KEY_PROVIDERS.map(({ provider, label }) => {
                  const providerKeys = keys[provider] ?? [];
                  return (
                    <div key={provider} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label
                          htmlFor={`key-${provider}-0`}
                          className="flex items-center gap-1.5"
                        >
                          <KeyRound className="size-3.5 text-muted-foreground" />
                          {label}
                        </Label>
                        <Button
                          type="button"
                          size="icon"
                          onClick={() =>
                            setKeys((prev) => ({
                              ...prev,
                              [provider]: [...(prev[provider] ?? []), ""],
                            }))
                          }
                          aria-label={`Add ${label} key`}
                          className="size-7 rounded-lg"
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                       {providerKeys.map((val, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setVisibleKeys((prev) => ({
                                ...prev,
                                [`${provider}-${idx}`]: !prev[`${provider}-${idx}`],
                              }))
                            }
                            aria-label={
                              visibleKeys[`${provider}-${idx}`]
                                ? "Hide key"
                                : "Show key"
                            }
                            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-surface-elevated hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            {visibleKeys[`${provider}-${idx}`] ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                          <Input
                            id={`key-${provider}-${idx}`}
                            type={
                              visibleKeys[`${provider}-${idx}`]
                                ? "text"
                                : "password"
                            }
                            value={val}
                            onChange={(e) =>
                              setKeys((prev) => {
                                const next = { ...prev };
                                const arr = [...(next[provider] ?? [])];
                                arr[idx] = e.target.value;
                                next[provider] = arr;
                                return next;
                              })
                            }
                            placeholder="sk-..."
                            className="text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setKeys((prev) => {
                                const next = { ...prev };
                                const arr = (next[provider] ?? []).filter(
                                  (_, i) => i !== idx,
                                );
                                if (arr.length) next[provider] = arr;
                                else delete next[provider];
                                return next;
                              })
                            }
                            aria-label={`Remove ${label} key`}
                            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
              {useOwnKeys && hasAnyKey ? (
                <p className="text-xs text-success">
                  Your generation limit is removed while keys are set.
                </p>
              ) : null}
            </div>
          )}
        </CollapsibleContent>
        </Collapsible>
        {!isGuest && (
          <div className="mt-3 flex justify-end">
            <Button
              onClick={handleSaveKeys}
              disabled={savingKeys || !isKeysDirty}
            >
              Save
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
