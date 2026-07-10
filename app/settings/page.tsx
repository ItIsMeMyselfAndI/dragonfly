"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Sun, Moon, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
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

const API_KEY_PROVIDERS: { provider: ProviderType; label: string }[] = [
  { provider: ProviderType.GEMINI, label: "Gemini" },
  { provider: ProviderType.OPENAI, label: "OpenAI" },
  { provider: ProviderType.OPENROUTER, label: "OpenRouter" },
  { provider: ProviderType.CHATGPT, label: "ChatGPT" },
];

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-surface/60 p-4 ring-1 ring-white/5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { isGuest } = useAuth();
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
  const [savingKeys, setSavingKeys] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    getRateLimitStatus()
      .then(setRateLimit)
      .catch(() => setRateLimit(null));
    if (!isGuest) {
      getApiKeys()
        .then(setKeys)
        .catch(() => setKeys({}));
    }
  }, [isGuest]);

  const isDark = mounted ? theme === "dark" : true;

  async function handleSaveKeys() {
    setSavingKeys(true);
    try {
      await saveApiKeys(keys);
      toast.success("API keys saved. Your generation limit is now removed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save API keys");
    } finally {
      setSavingKeys(false);
    }
  }

  const hasAnyKey = Object.values(keys).some((v) => v && v.trim().length > 0);

  return (
    <div className="flex flex-col gap-4 px-5 pt-2 pb-32">
      <PageHeader trail={[{ label: "Settings" }]} />

      <Card title="Preferences" description="App-wide appearance and alerts.">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Sun className="size-4 text-muted-foreground" />
              <span>Theme</span>
              <Moon className="size-4 text-muted-foreground" />
            </div>
            <Switch
              checked={isDark}
              onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
              aria-label="Toggle theme"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Notifications</span>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
              aria-label="Toggle notifications"
            />
          </div>
        </div>
      </Card>

      <Card
        title="AI Provider & Model"
        description="Choose the default provider used for generation."
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <Label htmlFor="set-provider">Provider</Label>
            <Select
              value={defaultProvider}
              onValueChange={(v) => setDefaultProvider(v as ProviderType)}
            >
              <SelectTrigger id="set-provider">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="set-model">Model</Label>
            <Select value={defaultModel} onValueChange={setDefaultModel}>
              <SelectTrigger id="set-model">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {MODELS_BY_PROVIDER[defaultProvider].map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card title="API Usage" description="Your remaining generations for today.">
        {rateLimit ? (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-medium">
                {rateLimit.remaining} / {rateLimit.limit}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">
                {rateLimit.isGuest ? "Guest" : "Signed in"}
              </span>
            </div>
            {hasAnyKey ? (
              <p className="mt-1 text-xs text-success">
                Unlimited — using your own API keys.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Unable to load usage.</p>
        )}
      </Card>

      <Collapsible
        open={keysOpen}
        onOpenChange={setKeysOpen}
        className="rounded-2xl bg-surface/60 p-4 ring-1 ring-white/5"
      >
        <CollapsibleTrigger className="flex w-full items-start justify-between gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
          <div>
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
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          {isGuest ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Sign in to add your own API keys and lift the generation limit.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              {API_KEY_PROVIDERS.map(({ provider, label }) => (
                <div key={provider} className="flex flex-col gap-3">
                  <Label
                    htmlFor={`key-${provider}`}
                    className="flex items-center gap-1.5"
                  >
                    <KeyRound className="size-3.5 text-muted-foreground" />
                    {label}
                  </Label>
                  <Input
                    id={`key-${provider}`}
                    type="password"
                    value={keys[provider] ?? ""}
                    onChange={(e) =>
                      setKeys((prev) => ({
                        ...prev,
                        [provider]: e.target.value,
                      }))
                    }
                    placeholder="sk-..."
                  />
                </div>
              ))}
              <Button
                onClick={handleSaveKeys}
                disabled={savingKeys || !hasAnyKey}
                className="self-start"
              >
                Save keys
              </Button>
              {hasAnyKey ? (
                <p className="text-xs text-success">
                  Your generation limit is removed while keys are set.
                </p>
              ) : null}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
