import { NextResponse } from "next/server";
import { getRequester } from "@/lib/auth/requester";
import {
  listNotifications,
  getOrCreatePromo,
  createNotification,
  countUnread,
  flagExpiredTrash,
  OWN_KEYS_FEATURE_ID,
} from "@/lib/apis/notification/mongo/server";
import {
  NOTIFICATION_TABS,
  type CreateNotificationInput,
  type NotificationTab,
} from "@/lib/apis/notification/types";

export async function GET(req: Request) {
  const { id, isGuest } = await getRequester();
  if (isGuest) {
    return NextResponse.json({ notifications: [], unread: 0 });
  }

  const tabParam = new URL(req.url).searchParams.get("tab");
  const tab: NotificationTab = NOTIFICATION_TABS.includes(
    tabParam as NotificationTab,
  )
    ? (tabParam as NotificationTab)
    : "all";

  // Persist the permanent-delete flag for stale trash items (idempotent).
  await flagExpiredTrash(id);

  const [list, promo, unread] = await Promise.all([
    listNotifications(id, tab),
    getOrCreatePromo(id),
    countUnread(id),
  ]);

  // The promo behaves like a normal notification in listings; only pin it to the
  // top of the All/Unread tabs while it's still active (dedupe to avoid a copy).
  let notifications = list;
  if (
    (tab === "all" || tab === "unread") &&
    promo &&
    !promo.actions.read.value &&
    !promo.actions.dismiss.value &&
    !promo.actions.delete.value
  ) {
    notifications = [
      promo,
      ...list.filter(
        (n) => n.metadata.featureId !== OWN_KEYS_FEATURE_ID,
      ),
    ];
  }

  return NextResponse.json({ notifications, unread });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as CreateNotificationInput;
  if (!body.title || !body.body) {
    return NextResponse.json(
      { error: "title and body are required" },
      { status: 400 },
    );
  }
  try {
    const notification = await createNotification({
      title: body.title,
      body: body.body,
      category: body.category,
      severity: body.severity,
      icon: body.icon,
      actions: body.actions,
      expiresAt: body.expiresAt,
      metadata: body.metadata,
    });
    return NextResponse.json({ notification }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Failed to create notification",
      },
      { status: 500 },
    );
  }
}
