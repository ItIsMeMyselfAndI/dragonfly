"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Loader2,
  X,
  Zap,
  Clock,
  Bot,
  Wifi,
  Network,
  Cpu,
} from "lucide-react";
import { useBom } from "../../features/bom/store";
import { ComponentCard } from "../../features/bom/ComponentCard";
import { SubstituteSheet } from "../../features/bom/SubstituteSheet";
import { compatibilityAlerts, type Component } from "../../features/bom/data";
import { useRouter, useSearchParams } from "next/navigation";
import { recentProjects } from "@/data/mock/projects";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, typeof Bot> = {
  Robotics: Bot,
  IoT: Wifi,
  Networking: Network,
  Mechatronics: Cpu,
  Power: Zap,
};
export default function BomScreen() {
  const { items, total, itemCount, loadProject, pushToCart } = useBom();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [sub, setSub] = useState<Component | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [checkout, setCheckout] = useState<"idle" | "loading" | "done">("idle");
  const router = useRouter();
  const searchParams = useSearchParams();

  const generate = searchParams?.get("generate");
  const prompt = searchParams?.get("prompt");

  useEffect(() => {
    if (generate === "true" && prompt) {
      setSelectedProject(decodeURIComponent(prompt));
    }
  }, [generate, prompt, setSelectedProject]);

  const handleSelectProject = (projectName: string) => {
    setSelectedProject(projectName);
    loadProject(projectName);
  };

  if (!selectedProject) {
    return (
      <div className="flex flex-col gap-6 px-5 pt-14 pb-48">
        <header>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            BOM Manager
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Select Project
          </h1>
        </header>
        <div className="flex flex-col gap-3">
          {recentProjects.map((p) => (
            <button
              key={p.name}
              onClick={() => handleSelectProject(p.name)}
              className="group flex items-center justify-between rounded-2xl bg-surface/60 p-4 ring-1 ring-white/5 transition-all hover:bg-surface-elevated hover:ring-primary/40 hover:shadow-[0_0_20px_-5px_var(--primary)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {(() => {
                    const Icon = categoryIcons[p.tag] || Zap;
                    return <Icon size={18} />;
                  })()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ₱{p.cost.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {p.tag}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={12} /> {p.time}
                  </span>
                </div>
                <ArrowRight
                  size={18}
                  className="text-muted-foreground group-hover:text-primary transition-colors"
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const handleCheckout = () => {
    setCheckout("loading");
    setTimeout(() => setCheckout("done"), 1400);
    setTimeout(() => {
      setCheckout("idle");
      if (selectedProject) pushToCart();
      router.push("/cart");
    }, 2400);
  };

  return (
    <>
      <div className="flex flex-col gap-4 px-5 pt-14 pb-48">
        <header className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <button
              onClick={() => setSelectedProject(null)}
              className="mb-2 flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <ArrowRight size={12} className="rotate-180" />
              Back
            </button>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Project
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {selectedProject}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {items.length} components · {itemCount} units
            </p>
          </div>
        </header>

        {/* Compatibility alert */}
        <AnimatePresence>
          {!alertDismissed &&
            (items.every((i) => i.stock === "in-stock") ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-3"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Check size={14} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-primary">
                    All components are in stock and compatible
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/80">
                    Your project is ready to build.
                  </p>
                </div>
                <button
                  onClick={() => setAlertDismissed(true)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ) : (
              [
                ...compatibilityAlerts.filter(
                  (a) =>
                    !a.componentId ||
                    items.some((item) => item.id === a.componentId),
                ),
                ...items
                  .filter((i) => i.stock === "out")
                  .map((i) => ({
                    id: `stock-${i.id}`,
                    severity: "warning" as const,
                    title: "Component out of stock",
                    message: `${i.name} is currently unavailable.`,
                    componentId: i.id,
                  })),
              ].map((a) => (
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
                    <p className="text-xs font-semibold text-warning">
                      {a.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/80">
                      {a.message}
                    </p>
                    {a.componentId && (
                      <button
                        onClick={() => {
                          const comp = items.find(
                            (i) => i.id === a.componentId,
                          );
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
              ))
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
            {(() => {
              const hasIssues =
                items.some((i) => i.stock === "out") ||
                compatibilityAlerts.some(
                  (a) =>
                    !a.componentId ||
                    items.some((item) => item.id === a.componentId),
                );

              return (
                <motion.button
                  whileTap={hasIssues ? {} : { scale: 0.97 }}
                  onClick={handleCheckout}
                  disabled={checkout !== "idle" || hasIssues}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground",
                    hasIssues
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "glow-primary bg-primary",
                  )}
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
                        {hasIssues ? "Fix issues to proceed" : "Push to cart"}
                        {!hasIssues && <ArrowRight size={16} />}
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
              );
            })()}
          </motion.div>
        </div>

        <SubstituteSheet
          component={sub}
          projectName={selectedProject}
          onClose={() => setSub(null)}
        />
      </div>
    </>
  );
}
