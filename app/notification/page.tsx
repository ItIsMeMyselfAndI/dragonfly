"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/features/auth/store";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";

export default function NotificationPage() {
  const { isGuest } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

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
            <p className="text-sm font-medium">
              Unlock 5 generations per day
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              You're on the guest plan (3 per day). Create a free account to
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
        <div className="rounded-2xl bg-surface/60 p-4 ring-1 ring-white/5">
          <p className="text-sm text-muted-foreground">
            You're all caught up. Account features and usage updates will appear
            here.
          </p>
        </div>
      )}

      {isGuest && <AuthModal open={authOpen} onOpenChange={setAuthOpen} />}
    </div>
  );
}
