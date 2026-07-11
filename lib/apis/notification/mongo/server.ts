import { randomUUID } from "crypto";
import { connectToDatabase } from "@/lib/mongodb/connection";
import {
  NotificationModel,
  type NotificationDocument,
} from "@/lib/mongodb/models/notification";
import { getRequester } from "@/lib/auth/requester";
import { isUsingOwnKeys } from "@/lib/settings/server";
import type {
  CreateNotificationInput,
  Notification,
  NotificationAction,
  NotificationActionStateKey,
  NotificationTab,
} from "../types";
import { NOTIFICATION_ACTION_STATE_KEYS } from "../types";

export const OWN_KEYS_FEATURE_ID = "own-api-keys";
const OWN_KEYS_PROMO_VERSION = 1;

const TRASH_TTL_MS = 15 * 24 * 60 * 60 * 1000;

function defaultStates() {
  const base = { value: false, at: null, permanent: false };
  return {
    read: { ...base },
    dismiss: { ...base },
    delete: { ...base },
    expand: { ...base },
    redirect: { ...base },
    external_link: { ...base },
    callback: { ...base },
  };
}

// "Try it out" must NOT mark the promo read on click — completing it means
// actually saving a key (which calls ensurePromoRead). An explicit "Dismiss"
// action lets the user hide it manually.
const OWN_KEYS_PROMO_ACTIONS: NotificationAction[] = [
  {
    id: "try-it-out",
    label: "Try it out",
    style: "primary",
    type: "redirect",
    path: "/settings?section=keys",
    dismissOnClick: false,
  },
  {
    id: "dismiss",
    label: "Dismiss",
    style: "ghost",
    type: "dismiss",
    dismissOnClick: false,
  },
];

function stateToPlain(s?: {
  value?: boolean;
  at?: Date | null;
  permanent?: boolean;
}): { value: boolean; at: string | null; permanent: boolean } {
  return {
    value: s?.value ?? false,
    at: s?.at ? s.at.toISOString() : null,
    permanent: s?.permanent ?? false,
  };
}

function toPlain(doc: NotificationDocument): Notification {
  return {
    id: doc._id,
    recipientId: doc.recipientId,
    recipientKind: doc.recipientKind,
    category: doc.category,
    severity: doc.severity,
    title: doc.title,
    body: doc.body,
    icon: doc.icon ?? undefined,
    details: doc.details ?? undefined,
    actionButtons: (doc.actionButtons ?? []).map((a) => ({
      id: a.id,
      label: a.label,
      style: (a.style ?? "primary") as NotificationAction["style"],
      type: a.type,
      path: a.path ?? undefined,
      url: a.url ?? undefined,
      endpoint: a.endpoint ?? undefined,
      method: a.method ?? undefined,
      payload: (a.payload ?? undefined) as Record<string, unknown> | undefined,
      dismissOnClick: a.dismissOnClick ?? true,
    })),
    actions: {
      read: stateToPlain(doc.actions?.read),
      dismiss: stateToPlain(doc.actions?.dismiss),
      delete: stateToPlain(doc.actions?.delete),
      expand: stateToPlain(doc.actions?.expand),
      redirect: stateToPlain(doc.actions?.redirect),
      external_link: stateToPlain(doc.actions?.external_link),
      callback: stateToPlain(doc.actions?.callback),
    },
    expiresAt: doc.expiresAt ? doc.expiresAt.toISOString() : null,
    metadata: (doc.metadata ?? {}) as Record<string, unknown>,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function buildFilter(recipientId: string, tab: NotificationTab) {
  const filter: Record<string, unknown> = { recipientId };

  switch (tab) {
    case "unread":
      filter["actions.read.value"] = false;
      filter["actions.dismiss.value"] = false;
      filter["actions.delete.value"] = { $ne: true };
      break;
    case "read":
      filter["actions.read.value"] = true;
      filter["actions.dismiss.value"] = false;
      filter["actions.delete.value"] = { $ne: true };
      break;
    case "dismissed":
      filter["actions.dismiss.value"] = true;
      filter["actions.delete.value"] = { $ne: true };
      break;
    case "trash":
      filter["actions.delete.value"] = true;
      filter["actions.delete.permanent"] = { $ne: true };
      break;
    case "all":
    default:
      filter["actions.delete.value"] = { $ne: true };
      break;
  }
  filter.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];

  return filter;
}

export async function listNotifications(
  recipientId: string,
  tab: NotificationTab = "all",
): Promise<Notification[]> {
  await connectToDatabase();
  const docs = await NotificationModel.find(buildFilter(recipientId, tab))
    .sort({ createdAt: -1 })
    .lean<NotificationDocument[]>();
  return docs.map(toPlain);
}

export async function countUnread(
  recipientId: string,
): Promise<number> {
  await connectToDatabase();
  return NotificationModel.countDocuments(buildFilter(recipientId, "unread"));
}

/**
 * Lazily create (and return) the "Use your own API keys" promo for a user.
 * Created once per user; if the user already has keys at creation time the
 * notification starts already-read so it never nags key-havers.
 */
export async function getOrCreatePromo(
  recipientId: string,
): Promise<Notification | null> {
  await connectToDatabase();
  const existing = await NotificationModel.findOne({
    recipientId,
    "metadata.featureId": OWN_KEYS_FEATURE_ID,
  }).lean<NotificationDocument>();

  if (existing) {
    const version = (existing.metadata as Record<string, unknown> | undefined)
      ?.promoVersion;
    if (version !== OWN_KEYS_PROMO_VERSION) {
      const hasKeys = await isUsingOwnKeys(recipientId);
      const now = hasKeys ? new Date() : null;
      await NotificationModel.updateOne(
        { _id: existing._id },
        {
          $set: {
            actionButtons: OWN_KEYS_PROMO_ACTIONS,
            "actions.read.value": hasKeys,
            "actions.read.at": now,
            "metadata.promoVersion": OWN_KEYS_PROMO_VERSION,
          },
        },
      );
      const updated = await NotificationModel.findOne({
        _id: existing._id,
      }).lean<NotificationDocument>();
      if (updated) return toPlain(updated);
    }
    return toPlain(existing);
  }

  const hasKeys = await isUsingOwnKeys(recipientId);
  const now = hasKeys ? new Date() : null;
  const doc = await NotificationModel.create({
    _id: randomUUID(),
    recipientId,
    recipientKind: "user",
    category: "feature",
    severity: "warning",
    title: "Use your own API keys",
    body: "Connect your own provider keys to use your provider's quota and lift the daily generation limit.",
    icon: "KeyRound",
    actionButtons: OWN_KEYS_PROMO_ACTIONS,
    actions: {
      ...defaultStates(),
      read: { value: hasKeys, at: now, permanent: false },
    },
    metadata: {
      featureId: OWN_KEYS_FEATURE_ID,
      promoVersion: OWN_KEYS_PROMO_VERSION,
    },
  });
  return toPlain(doc);
}

/**
 * Permanently mark the API-keys promo as read for a user. Called when the
 * user first adds their own key, so the promo will not reappear even if they
 * later delete all keys.
 */
export async function ensurePromoRead(
  recipientId: string,
): Promise<void> {
  await connectToDatabase();
  await NotificationModel.updateOne(
    { recipientId, "metadata.featureId": OWN_KEYS_FEATURE_ID },
    { $set: { "actions.read.value": true, "actions.read.at": new Date() } },
  );
}

export async function markRead(
  id: string,
  recipientId: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await NotificationModel.updateOne(
    { _id: id, recipientId },
    { $set: { "actions.read.value": true, "actions.read.at": new Date() } },
  );
  return res.matchedCount === 1;
}

/**
 * "Mark as read" on a dismissed item: set read and clear dismiss so the
 * message leaves the Dismissed tab (priority: dismissed > read) and moves to
 * the Read tab.
 */
export async function markReadClearDismiss(
  id: string,
  recipientId: string,
): Promise<boolean> {
  await connectToDatabase();
  const now = new Date();
  const res = await NotificationModel.updateOne(
    { _id: id, recipientId },
    {
      $set: {
        "actions.read.value": true,
        "actions.read.at": now,
        "actions.dismiss.value": false,
        "actions.dismiss.at": null,
      },
    },
  );
  return res.matchedCount === 1;
}

export async function dismiss(
  id: string,
  recipientId: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await NotificationModel.updateOne(
    { _id: id, recipientId },
    { $set: { "actions.dismiss.value": true, "actions.dismiss.at": new Date() } },
  );
  return res.matchedCount === 1;
}

/** Soft-delete: flag as deleted without removing the document. */
export async function softDelete(
  id: string,
  recipientId: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await NotificationModel.updateOne(
    { _id: id, recipientId },
    { $set: { "actions.delete.value": true, "actions.delete.at": new Date() } },
  );
  return res.matchedCount === 1;
}

/**
 * Persist the `permanent` flag for items that have been in the trash
 * for at least TRASH_TTL_MS. Permanently-deleted items stay in the DB but are
 * hidden from the Trash tab and cannot be restored. Idempotent.
 */
export async function flagExpiredTrash(
  recipientId: string,
): Promise<void> {
  await connectToDatabase();
  await NotificationModel.updateMany(
    {
      recipientId,
      "actions.delete.value": true,
      "actions.delete.permanent": { $ne: true },
      "actions.delete.at": { $lte: new Date(Date.now() - TRASH_TTL_MS) },
    },
    { $set: { "actions.delete.permanent": true } },
  );
}

/** Restore a soft-deleted item. Disabled once it is permanently deleted. */
export async function undelete(
  id: string,
  recipientId: string,
): Promise<boolean> {
  await connectToDatabase();
  const doc = await NotificationModel.findOne({
    _id: id,
    recipientId,
    "actions.delete.value": true,
  }).lean<NotificationDocument>();
  if (!doc || doc.actions?.delete?.permanent) return false;
  const res = await NotificationModel.updateOne(
    { _id: id, recipientId },
    { $set: { "actions.delete.value": false, "actions.delete.at": null } },
  );
  return res.matchedCount === 1;
}

/**
 * Perform an action: mark its own state `value: true` (+ `at`), and — unless it
 * is `dismiss` — also mark the message read. Used by redirect / external_link /
 * callback / expand and the explicit read action.
 */
export async function performAction(
  id: string,
  recipientId: string,
  actionType: NotificationActionStateKey,
): Promise<boolean> {
  await connectToDatabase();
  if (!NOTIFICATION_ACTION_STATE_KEYS.includes(actionType)) return false;
  const set: Record<string, unknown> = {
    [`actions.${actionType}.value`]: true,
    [`actions.${actionType}.at`]: new Date(),
  };
  if (actionType !== "dismiss") {
    set["actions.read.value"] = true;
    set["actions.read.at"] = new Date();
  }
  const res = await NotificationModel.updateOne(
    { _id: id, recipientId },
    { $set: set },
  );
  return res.matchedCount === 1;
}

/** Generic create — used to push any promo/notification for the requester. */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<Notification> {
  const { id, isGuest } = await getRequester();
  await connectToDatabase();
  const doc = await NotificationModel.create({
    _id: randomUUID(),
    recipientId: id,
    recipientKind: isGuest ? "guest" : "user",
    category: input.category ?? "info",
    severity: input.severity ?? "info",
    title: input.title,
    body: input.body,
    icon: input.icon,
    actionButtons: input.actions ?? [],
    actions: defaultStates(),
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    metadata: input.metadata ?? {},
  });
  return toPlain(doc);
}
