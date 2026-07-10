"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/features/auth/store";

export function NotificationBell() {
  const { isGuest } = useAuth();

  return (
    <Link
      href="/notification"
      aria-label="Notifications"
      className="relative inline-flex size-10 items-center justify-center text-primary outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary rounded-full"
    >
      <Bell className="size-5" />
      {isGuest && (
        <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-destructive ring-2 ring-background" />
      )}
    </Link>
  );
}
