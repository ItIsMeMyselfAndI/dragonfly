import { NextResponse } from "next/server";
import { getRequester } from "@/lib/auth/requester";
import {
  markRead,
  dismiss,
  softDelete,
  undelete,
  performAction,
  markReadClearDismiss,
} from "@/lib/apis/notification/mongo/server";
import { NOTIFICATION_ACTION_STATE_KEYS } from "@/lib/apis/notification/types";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: requesterId } = await getRequester();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    actionType?: string;
  };
  const action = body.action;

  try {
    if (action === "read") {
      await markRead(id, requesterId);
    } else if (action === "mark-read-clear-dismiss") {
      await markReadClearDismiss(id, requesterId);
    } else if (action === "dismiss") {
      await dismiss(id, requesterId);
    } else if (action === "delete") {
      await softDelete(id, requesterId);
    } else if (action === "undelete") {
      await undelete(id, requesterId);
    } else if (action === "perform") {
      if (
        !body.actionType ||
        !NOTIFICATION_ACTION_STATE_KEYS.includes(
          body.actionType as (typeof NOTIFICATION_ACTION_STATE_KEYS)[number],
        )
      ) {
        return NextResponse.json(
          { error: "Invalid actionType" },
          { status: 400 },
        );
      }
      await performAction(
        id,
        requesterId,
        body.actionType as (typeof NOTIFICATION_ACTION_STATE_KEYS)[number],
      );
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
