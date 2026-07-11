"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth, useSessionVersion } from "@/features/auth/store";
import { getNotifications } from "@/lib/apis/notification/client";
import { subscribeNotificationsChanged } from "@/lib/apis/notification/events";

export function NotificationBell() {
  const { isGuest } = useAuth();
  const sessionVersion = useSessionVersion();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (isGuest) return;
    let active = true;
    getNotifications()
      .then((res) => {
        if (active) setUnread(res.unread);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [sessionVersion, isGuest]);

  // Refetch the unread count whenever a notification is read/dismissed/deleted
  // anywhere in the app, so the dot reflects the current state immediately.
  useEffect(() => {
    if (isGuest) return;
    const unsubscribe = subscribeNotificationsChanged(() => {
      getNotifications()
        .then((res) => setUnread(res.unread))
        .catch(() => {});
    });
    return unsubscribe;
  }, [isGuest]);

  const showDot = isGuest || unread > 0;

  return (
    <Link
      href="/notification"
      aria-label="Notifications"
      className="relative inline-flex size-10 items-center justify-center text-primary outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary rounded-full"
    >
      <Bell className="size-5" />
      {showDot && (
        <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-destructive ring-2 ring-background" />
      )}
    </Link>
  );
}
