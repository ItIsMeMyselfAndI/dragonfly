"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface NavigationGuardHandler {
  isDirty: () => boolean;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
}

type PendingNav = { type: "href"; href: string } | { type: "back" };

interface NavigationGuardContextValue {
  navigate: (target: string | "back") => void;
  registerGuard: (handler: NavigationGuardHandler) => () => void;
}

const NavigationGuardContext =
  createContext<NavigationGuardContextValue | null>(null);

export function NavigationGuardProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const handlerRef = useRef<NavigationGuardHandler | null>(null);
  const pendingRef = useRef<PendingNav | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const performNav = useCallback(
    (target: PendingNav | null) => {
      if (!target) return;
      if (target.type === "back") router.back();
      else router.push(target.href);
    },
    [router],
  );

  const registerGuard = useCallback((handler: NavigationGuardHandler) => {
    handlerRef.current = handler;
    return () => {
      if (handlerRef.current === handler) handlerRef.current = null;
    };
  }, []);

  const navigate = useCallback(
    (target: string | "back") => {
      const handler = handlerRef.current;
      const next: PendingNav =
        target === "back" ? { type: "back" } : { type: "href", href: target };
      if (handler && handler.isDirty()) {
        pendingRef.current = next;
        setOpen(true);
      } else {
        performNav(next);
      }
    },
    [performNav],
  );

  const handleSave = useCallback(async () => {
    const handler = handlerRef.current;
    if (!handler) return;
    try {
      setSaving(true);
      await handler.onSave();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to save changes",
      );
      return;
    } finally {
      setSaving(false);
    }
    const target = pendingRef.current;
    pendingRef.current = null;
    setOpen(false);
    performNav(target);
  }, [performNav]);

  const handleDiscard = useCallback(() => {
    const handler = handlerRef.current;
    if (handler) handler.onDiscard();
    const target = pendingRef.current;
    pendingRef.current = null;
    setOpen(false);
    performNav(target);
  }, [performNav]);

  return (
    <NavigationGuardContext.Provider
      value={useMemo(
        () => ({ navigate, registerGuard }),
        [navigate, registerGuard],
      )}
    >
      {children}
      <AlertDialog open={open}>
        <AlertDialogContent
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Save them or discard before leaving this
            page.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={handleDiscard}
              disabled={saving}
            >
              Discard
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard(handler: NavigationGuardHandler) {
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) {
    throw new Error(
      "useNavigationGuard must be used within NavigationGuardProvider",
    );
  }
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });
  useEffect(() => {
    return ctx.registerGuard({
      isDirty: () => handlerRef.current.isDirty(),
      onSave: () => handlerRef.current.onSave(),
      onDiscard: () => handlerRef.current.onDiscard(),
    });
  }, [ctx]);
}

export function useNavigate() {
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) {
    throw new Error("useNavigate must be used within NavigationGuardProvider");
  }
  return ctx.navigate;
}
