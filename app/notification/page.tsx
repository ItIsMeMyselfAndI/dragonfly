"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  KeyRound,
  Megaphone,
  AlertTriangle,
  Gift,
  Info,
  ExternalLink,
  Trash2,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/store";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import {
  getNotifications,
  markReadClearDismiss,
  dismissNotification,
  deleteNotification,
  undeleteNotification,
  performNotificationAction,
} from "@/lib/apis/notification/client";
import type {
  Notification,
  NotificationAction,
  NotificationSeverity,
  NotificationTab,
} from "@/lib/apis/notification/types";

const iconMap: Record<string, LucideIcon> = {
  KeyRound,
  Megaphone,
  AlertTriangle,
  Gift,
  Info,
  Bell,
};

const severityRing: Record<NotificationSeverity, string> = {
  info: "ring-white/5",
  success: "ring-emerald-500/30",
  warning: "ring-primary/30",
  critical: "ring-destructive/30",
};

const TABS: { id: NotificationTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
  { id: "dismissed", label: "Dismissed" },
  { id: "trash", label: "Trash" },
];

const TRASH_TTL_DAYS = 15;

function trashEta(deletedAt: string | null, now: number): string | null {
  if (!deletedAt) return null;
  const permanent = new Date(deletedAt).getTime() + TRASH_TTL_DAYS * 86400000;
  const ms = permanent - now;
  if (ms <= 0) return "less than a minute";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function NotificationPage() {
  const { isGuest } = useAuth();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [tab, setTab] = useState<NotificationTab>("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(!isGuest);
  const [expanded, setExpanded] = useState<Notification | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async (t: NotificationTab) => {
    setLoading(true);
    try {
      const res = await getNotifications(t);
      setNotifications(res.notifications);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isGuest) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(tab);
  }, [isGuest, tab, load]);

  // Tick the clock so the Trash "permanently deleted in" countdown updates live.
  useEffect(() => {
    if (tab !== "trash") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [tab]);

  const handleAction = async (
    notification: Notification,
    action: NotificationAction,
  ) => {
    if (action.type === "dismiss") {
      await dismissNotification(notification.id);
      await load(tab);
      return;
    }

    if (action.type === "expand") {
      setExpanded(notification);
    } else if (action.type === "redirect" && action.path) {
      router.push(action.path);
    } else if (action.type === "external_link" && action.url) {
      window.open(action.url, "_blank", "noopener,noreferrer");
    } else if (action.type === "callback" && action.endpoint) {
      await fetch(action.endpoint, {
        method: action.method ?? "POST",
        headers: { "Content-Type": "application/json" },
        body: action.payload ? JSON.stringify(action.payload) : undefined,
      });
    }

    // Every non-dismiss action marks its own state AND the message as read.
    await performNotificationAction(notification.id, action.type);
    await load(tab);
  };

  const handleDelete = async (notification: Notification) => {
    await deleteNotification(notification.id);
    await load(tab);
  };

  const handleUndelete = async (notification: Notification) => {
    await undeleteNotification(notification.id);
    await load(tab);
  };

  const renderActions = (
    n: Notification,
    onAfter?: () => void,
  ): React.ReactNode =>
    (n.actionButtons ?? []).map((a) => {
      if (a.type === "dismiss" && n.actions.dismiss.value) {
        return (
          <Button
            key={a.id}
            size="sm"
            variant="ghost"
            type="button"
            onClick={async () => {
              await markReadClearDismiss(n.id);
              await load(tab);
              onAfter?.();
            }}
          >
            Mark as read
          </Button>
        );
      }
      return (
        <Button
          key={a.id}
          size="sm"
          variant={
            a.type === "dismiss"
              ? "secondary"
              : a.style === "secondary"
                ? "secondary"
                : a.style === "ghost"
                  ? "ghost"
                  : "default"
          }
          onClick={() => {
            handleAction(n, a);
            onAfter?.();
          }}
          type="button"
        >
          {a.type === "external_link" && <ExternalLink className="size-3.5" />}
          {a.label}
        </Button>
      );
    });

  return (
    <div className="flex flex-col gap-6 px-5 pt-2 pb-24">
      <PageHeader trail={[{ label: "Notifications" }]} />

      {isGuest ? (
        <div className="flex items-start gap-3 rounded-2xl bg-surface/60 p-4 ring-1 ring-white/5">
          <span className="relative mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-destructive ring-2 ring-surface" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium">Unlock 5 generations per day</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You&apos;re on the guest plan (3 per day). Create a free account to
              raise your limit to 5 generations per day.
            </p>
            <Button
              className="mt-3"
              size="sm"
              onClick={() => setAuthOpen(true)}
              type="button"
            >
              Create account
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-1 rounded-xl bg-surface/60 p-1 ring-1 ring-white/5">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="rounded-2xl bg-surface/60 p-4 ring-1 ring-white/5">
              <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-2xl bg-surface/60 p-4 ring-1 ring-white/5">
              <p className="text-sm text-muted-foreground">
                {tab === "trash"
                  ? "No deleted notifications."
                  : "You're all caught up. Account features and usage updates will appear here."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {notifications.map((n) => {
                const Icon = n.icon ? iconMap[n.icon] ?? Bell : Bell;
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 rounded-2xl bg-surface/60 p-4 ring-1 ${
                      severityRing[n.severity]
                    } ${n.actions.read.value ? "opacity-70" : ""}`}
                  >
                    <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon size={18} />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {n.body}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {renderActions(n)}
                        {tab !== "trash" && (
                          <button
                            type="button"
                            aria-label="Delete notification"
                            onClick={() => handleDelete(n)}
                            className="ml-auto inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground ring-1 ring-white/5 transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        {tab === "trash" && !n.actions.delete.permanent && (
                          <button
                            type="button"
                            aria-label="Restore notification"
                            onClick={() => handleUndelete(n)}
                            className="ml-auto inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground ring-1 ring-white/5 transition-colors hover:bg-primary/10 hover:text-primary"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                        {tab === "trash" &&
                          (() => {
                            const eta = trashEta(n.actions.delete.at, now);
                            return eta ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Permanently deleted in{" "}
                              <span className="text-destructive">{eta}</span>
                            </p>
                          ) : null;
                        })()}
                    </div>
                    {!n.actions.read.value &&
                      !n.actions.dismiss.value &&
                      tab !== "trash" && (
                        <span className="mt-1 size-2.5 shrink-0 rounded-full bg-destructive" />
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Dialog
        open={!!expanded}
        onOpenChange={(open) => {
          if (!open) setExpanded(null);
        }}
      >
        <DialogContent>
          <DialogHeader className="-mx-4 -mt-4 flex flex-col gap-1 rounded-t-xl border-b bg-muted/50 p-4">
            <DialogTitle>{expanded?.title}</DialogTitle>
            <DialogDescription>{expanded?.body}</DialogDescription>
          </DialogHeader>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
            {expanded?.details ?? expanded?.body}
          </p>
          <div className="-mx-4 -mb-4 flex flex-row flex-wrap items-center gap-2 rounded-b-xl border-t bg-muted/50 p-4">
            {expanded &&
              renderActions(
                {
                  ...expanded,
                  actionButtons: expanded.actionButtons.filter(
                    (a) => a.type !== "expand",
                  ),
                },
                () => setExpanded(null),
              )}
          </div>
        </DialogContent>
      </Dialog>

      {isGuest && <AuthModal open={authOpen} onOpenChange={setAuthOpen} />}
    </div>
  );
}
