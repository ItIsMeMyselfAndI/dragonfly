"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Bell, Settings, Sun, Moon, User } from "lucide-react";
import { useAuth } from "@/features/auth/store";
import { AuthModal } from "@/components/AuthModal";
import { AccountModal } from "@/components/AccountModal";

function getInitials(name?: string | null, email?: string | null): string {
  const source = name || email || "";
  return source.slice(0, 2).toUpperCase() || "U";
}

const itemClass =
  "hover:bg-muted focus:bg-muted dark:hover:bg-primary/15 dark:focus:bg-primary/15 dark:hover:**:text-popover-foreground! dark:focus:**:text-popover-foreground!";

export function UserMenu() {
  const { user, profile, isGuest } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const initial = getInitials(profile?.username, user?.email);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className="relative inline-flex size-10 items-center justify-center rounded-full bg-surface text-primary ring-1 ring-primary/30 outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary"
          >
            {user ? (
              <Avatar size="lg" className="size-10">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={initial} />
                ) : null}
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
            ) : (
              <User className="size-5 text-primary" />
            )}
            {isGuest && (
              <span className="absolute -top-0.5 -left-0.5 size-3 rounded-full bg-destructive ring-2 ring-background" />
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onSelect={() => router.push("/notification")}
            className={itemClass}
          >
            <Bell />
            <span>Notifications</span>
            {isGuest && (
              <span className="ml-auto size-2 rounded-full bg-destructive" />
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className={itemClass}
          >
            <Sun />
            <Switch
              checked={mounted ? theme === "dark" : true}
              onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
              aria-label="Toggle theme"
              className="mx-auto"
            />
            <Moon />
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setSettingsOpen(true);
            }}
            className={itemClass}
          >
            <Settings />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isGuest ? (
        <AuthModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      ) : (
        <AccountModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      )}
    </>
  );
}
