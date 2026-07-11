import type {
  Notification,
  NotificationActionStateKey,
  NotificationTab,
} from "./types";
import { notifyNotificationsChanged } from "./events";

export interface NotificationsResponse {
  notifications: Notification[];
  unread: number;
}

export async function getNotifications(
  tab: NotificationTab = "all",
): Promise<NotificationsResponse> {
  const res = await fetch(`/api/v2/notifications?tab=${tab}`, {
    method: "GET",
  });
  if (!res.ok) return { notifications: [], unread: 0 };
  return (await res.json()) as NotificationsResponse;
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetch(`/api/v2/notifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "read" }),
  });
  notifyNotificationsChanged();
}

export async function markReadClearDismiss(id: string): Promise<void> {
  await fetch(`/api/v2/notifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "mark-read-clear-dismiss" }),
  });
  notifyNotificationsChanged();
}

export async function dismissNotification(id: string): Promise<void> {
  await fetch(`/api/v2/notifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "dismiss" }),
  });
  notifyNotificationsChanged();
}

export async function deleteNotification(id: string): Promise<void> {
  await fetch(`/api/v2/notifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete" }),
  });
  notifyNotificationsChanged();
}

export async function undeleteNotification(id: string): Promise<void> {
  await fetch(`/api/v2/notifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "undelete" }),
  });
  notifyNotificationsChanged();
}

export async function performNotificationAction(
  id: string,
  actionType: NotificationActionStateKey,
): Promise<void> {
  await fetch(`/api/v2/notifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "perform", actionType }),
  });
  notifyNotificationsChanged();
}
