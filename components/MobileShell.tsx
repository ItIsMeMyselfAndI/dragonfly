import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { BottomNav } from "./BottomNav";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-[440px] flex-col bg-background">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-32 h-72 bg-[radial-gradient(ellipse_at_center,var(--glow),transparent_70%)] opacity-30" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--color-accent),transparent_70%)] opacity-10" />
      <header className="glass sticky top-0 z-50 flex items-center justify-between px-5 pt-4 pb-2">
        <Link
          href="/"
          className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
        >
          <Image
            src="/logo.jpg"
            alt="Dragonfly"
            width={40}
            height={40}
            className="size-10 rounded-full object-cover ring-1 ring-primary/30"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Dragonfly
            </span>
            <span className="text-xs text-muted-foreground">
              Let&apos;s build something
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserMenu />
        </div>
      </header>
      <main className="relative z-10 min-h-0 flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}

