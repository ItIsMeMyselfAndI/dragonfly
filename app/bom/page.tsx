"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, Loader2, X } from "lucide-react";
import { useBom } from "../../features/bom/store";
import { ComponentCard } from "../../features/bom/ComponentCard";
import { SubstituteSheet } from "../../features/bom/SubstituteSheet";
import { BottomNav } from "../../components/BottomNav";
import { compatibilityAlerts, type Component } from "../../features/bom/data";
import { useRouter } from "next/navigation";

export default function BomScreen() {
  const { items, total, itemCount } = useBom();
  const [sub, setSub] = useState<Component | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [checkout, setCheckout] = useState<"idle" | "loading" | "done">("idle");
  const router = useRouter();

  const handleCheckout = () => {
    setCheckout("loading");
    setTimeout(() => setCheckout("done"), 1400);
    setTimeout(() => {
      setCheckout("idle");
      router.push("/cart");
    }, 2400);
  };

  return (
    <>
      <div className="flex flex-col gap-4 px-5 pt-14 pb-48">
        <header className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Project
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Line-Follower Bot
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {items.length} components · {itemCount} units
            </p>
          </div>
        </header>

        {/* Compatibility alert */}
        <AnimatePresence>
          {!alertDismissed &&
            compatibilityAlerts.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-3"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning/20">
                  <AlertTriangle size={14} className="text-warning" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-warning">{a.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/80">
                    {a.message}
                  </p>
                  {a.componentId && (
                    <button
                      onClick={() => {
                        const comp = items.find((i) => i.id === a.componentId);
                        if (comp) setSub(comp);
                      }}
                      className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-warning underline underline-offset-2 hover:cursor-pointer"
                    >
                      Fix issue
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setAlertDismissed(true)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
        </AnimatePresence>

        {/* Component feed */}
        <div className="flex flex-col gap-3">
          {items.map((c) => (
            <ComponentCard key={c.id} c={c} onFindSubstitute={setSub} />
          ))}
        </div>

        {/* Sticky checkout */}
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 mx-auto flex max-w-[440px] justify-center px-5">
          <motion.div
            layout
            className="glass pointer-events-auto flex w-full items-center justify-between gap-3 rounded-full border border-white/10 p-2 pl-5 glow-soft"
          >
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Total
              </p>
              <motion.p
                key={total}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-base font-semibold tabular-nums"
                >
                ₱{total.toFixed(2)}
                </motion.p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCheckout}
              disabled={checkout !== "idle"}
              className="glow-primary flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              <AnimatePresence mode="wait">
                {checkout === "idle" && (
                  <motion.span
                    key="i"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    Push to cart <ArrowRight size={16} />
                  </motion.span>
                )}
                {checkout === "loading" && (
                  <motion.span
                    key="l"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 size={16} className="animate-spin" /> Pushing…
                  </motion.span>
                )}
                {checkout === "done" && (
                  <motion.span
                    key="d"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Check size={16} /> Sent
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </div>

        <SubstituteSheet component={sub} onClose={() => setSub(null)} />
      </div>
    </>
  );
}
