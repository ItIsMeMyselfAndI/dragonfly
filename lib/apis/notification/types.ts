export type NotificationRecipientKind = "user" | "guest";

export type NotificationCategory =
  | "system"
  | "feature"
  | "promo"
  | "billing"
  | "security"
  | "info";

export type NotificationSeverity = "info" | "success" | "warning" | "critical";

export type NotificationActionType =
  | "redirect"
  | "external_link"
  | "callback"
  | "dismiss"
  | "expand";

export type NotificationActionStateKey =
  | "read"
  | "dismiss"
  | "delete"
  | "expand"
  | "redirect"
  | "external_link"
  | "callback";

export interface NotificationAction {
  id: string;
  label: string;
  style?: "primary" | "secondary" | "ghost";
  type: NotificationActionType;
  path?: string;
  url?: string;
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  payload?: Record<string, unknown>;
  dismissOnClick?: boolean;
}

export interface NotificationActionState {
  value: boolean;
  at: string | null;
  permanent?: boolean;
}

export interface NotificationActionStates {
  read: NotificationActionState;
  dismiss: NotificationActionState;
  delete: NotificationActionState;
  expand: NotificationActionState;
  redirect: NotificationActionState;
  external_link: NotificationActionState;
  callback: NotificationActionState;
}

export interface Notification {
  id: string;
  recipientId: string;
  recipientKind: NotificationRecipientKind;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  body: string;
  icon?: string;
  details?: string;
  actionButtons: NotificationAction[];
  actions: NotificationActionStates;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const NOTIFICATION_RECIPIENT_KINDS = ["user", "guest"] as const;
export const NOTIFICATION_CATEGORIES = [
  "system",
  "feature",
  "promo",
  "billing",
  "security",
  "info",
] as const;
export const NOTIFICATION_SEVERITIES = [
  "info",
  "success",
  "warning",
  "critical",
] as const;
export const NOTIFICATION_ACTION_TYPES = [
  "redirect",
  "external_link",
  "callback",
  "dismiss",
  "expand",
] as const;
export const NOTIFICATION_ACTION_STATE_KEYS = [
  "read",
  "dismiss",
  "delete",
  "expand",
  "redirect",
  "external_link",
  "callback",
] as const;
export const NOTIFICATION_ACTION_STYLES = [
  "primary",
  "secondary",
  "ghost",
] as const;

export const NOTIFICATION_TABS = [
  "all",
  "unread",
  "read",
  "dismissed",
  "trash",
] as const;
export type NotificationTab = (typeof NOTIFICATION_TABS)[number];

export interface CreateNotificationInput {
  title: string;
  body: string;
  category?: NotificationCategory;
  severity?: NotificationSeverity;
  icon?: string;
  actions?: NotificationAction[];
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
}
