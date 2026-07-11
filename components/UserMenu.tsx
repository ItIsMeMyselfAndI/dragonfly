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
import { Settings, Sun, Moon, User } from "lucide-react";
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
  const [accountOpen, setAccountOpen] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const initial = getInitials(profile?.username, user?.email);
  const isDark = mounted ? theme === "dark" : true;

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
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem className={itemClass}>
            <Sun />
            <Switch
              checked={isDark}
              onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
              aria-label="Toggle theme"
              className="mx-auto"
            />
            <Moon />
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => setAccountOpen(true)}
            className={itemClass}
          >
            <User />
            <span>Account</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => router.push("/settings")}
            className={itemClass}
          >
            <Settings />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isGuest ? (
        <AuthModal open={accountOpen} onOpenChange={setAccountOpen} />
      ) : (
        <AccountModal open={accountOpen} onOpenChange={setAccountOpen} />
      )}
    </>
  );
}
