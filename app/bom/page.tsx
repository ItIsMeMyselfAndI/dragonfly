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
import { useBom } from "@/features/bom/store";
import { ComponentCard } from "@/features/bom/ComponentCard";
import { SubstituteSheet } from "@/features/bom/SubstituteSheet";
import { compatibilityAlerts } from "@/features/bom/data";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllProjects } from "@/lib/project/client";
import {
  ProjectCartSummary,
  ProjectComponentModel,
  ProjectTagEnum,
  type ProjectModel,
} from "@/lib/project/types";
import { ProjectCost } from "@/components/ProjectCost";
import { cn, formatRelativeTime } from "@/lib/utils";
import { StockStatus } from "@/lib/inventory/types";

const categoryIcons: Record<string, typeof Bot> = {
  Robotics: Bot,
  IoT: Wifi,
  Networking: Network,
  Mechatronics: Cpu,
  Power: Zap,
};

function ProjectItem({
  project,
  onSelect,
}: {
  project: ProjectModel;
  onSelect: (name: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(project.name)}
      className="group flex items-center justify-between rounded-2xl bg-surface/60 p-4 ring-1 ring-white/5 transition-all hover:bg-surface-elevated hover:ring-primary/40 hover:shadow-[0_0_20px_-5px_var(--primary)]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {(() => {
            const Icon = categoryIcons[project.tag] || Zap;
            return <Icon size={18} />;
          })()}
        </div>
        <div className="text-left">
          <p className="text-sm font-medium">{project.name}</p>
          <p className="text-xs text-muted-foreground">
            <ProjectCost project={project} />
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {project.tag}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock size={12} /> {formatRelativeTime(project.time)}
          </span>
        </div>
        <ArrowRight
          size={18}
          className="text-muted-foreground group-hover:text-primary transition-colors"
        />
      </div>
    </button>
  );
}

export default function BomScreen() {
  const { components, alerts, total, itemCount, loadProject, pushToCart } =
    useBom();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [sub, setSub] = useState<ProjectComponentModel | null>(null); // Note: updated to use ProjectComponentModel
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [checkout, setCheckout] = useState<"idle" | "loading" | "done">("idle");
  const router = useRouter();
  const searchParams = useSearchParams();

  const generate = searchParams?.get("generate");
  const prompt = searchParams?.get("prompt");

  useEffect(() => {
    async function init() {
      try {
        const data = await getAllProjects();
        setProjects(data);

        if ((generate === "true" || generate === "dynamic") && prompt) {
          const decodedPrompt = decodeURIComponent(prompt);
          setSelectedProject(decodedPrompt);
        }
      } catch (e) {
        console.error("Failed to initialize BOM screen", e);
      }
    }
    init();
  }, [generate, prompt]);

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
          {projects.map((p) => (
            <ProjectItem
              key={p.id}
              project={p}
              onSelect={handleSelectProject}
            />
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
      if (selectedProject) {
        const project = projects.find((p) => p.name === selectedProject);
        if (project) {
          const summary: Omit<ProjectCartSummary, "totalPrice"> = {
            id: `${project.name}-${Date.now()}`,
            name: project.name,
            tag: project.tag,
            timestamp: new Date().toLocaleString(),
            items: components.map((item) => ({
              ...item,
              qtyPrice: item.unitPrice * item.qty,
            })),
          };
          pushToCart(summary);
        } else if (components.length > 0) {
          // Dynamic AI Project
          const summary: Omit<ProjectCartSummary, "totalPrice"> = {
            id: `dynamic-${Date.now()}`,
            name: selectedProject,
            tag: ProjectTagEnum.NA,
            timestamp: new Date().toLocaleString(),
            items: components.map((item) => ({
              ...item,
              qtyPrice: item.unitPrice * item.qty,
            })),
          };
          pushToCart(summary);
        }
      }
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
              {components.length} components · {itemCount} units
            </p>
          </div>
        </header>

        {/* Compatibility alert */}
        <AnimatePresence>
          {!alertDismissed &&
            (components.length > 0 &&
            components.every((i) => i.stock === StockStatus.IN_STOCK) &&
            alerts.length === 0 ? (
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
                ...alerts, // Dynamic alerts from context
                ...compatibilityAlerts.filter(
                  (a) =>
                    !a.componentId ||
                    components.some((item) => item.id === a.componentId),
                ),
                ...components
                  .filter((i) => i.stock === StockStatus.OUT)
                  .map((i) => ({
                    id: `stock-${i.id}`,
                    severity: "warning" as const,
                    title: "Component out of stock",
                    message: `${i.name} is currently unavailable.`,
                    componentId: i.id,
                  })),
              ].map((a) => (
                <motion.div
                  key={a.id || a.title}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-3",
                    a.severity === "warning"
                      ? "border-warning/30 bg-warning/10"
                      : "border-blue-500/30 bg-blue-500/10",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      a.severity === "warning"
                        ? "bg-warning/20"
                        : "bg-blue-500/20",
                    )}
                  >
                    <AlertTriangle
                      size={14}
                      className={
                        a.severity === "warning"
                          ? "text-warning"
                          : "text-blue-500"
                      }
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-xs font-semibold",
                        a.severity === "warning"
                          ? "text-warning"
                          : "text-blue-500",
                      )}
                    >
                      {a.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/80">
                      {a.message}
                    </p>
                    {a.componentId && (
                      <button
                        onClick={() => {
                          const comp = components.find(
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
          {components.map((c) => (
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
                components.some((i) => i.stock === StockStatus.OUT) ||
                compatibilityAlerts.some(
                  (a) =>
                    !a.componentId ||
                    components.some((item) => item.id === a.componentId),
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
