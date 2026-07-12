"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Loader2,
  X,
  FileText,
  Download,
  ShoppingCart,
  Copy,
  GitBranch,
  Settings,
} from "lucide-react";
import { useBom } from "@/features/bom/store";
import { ComponentCard } from "@/features/bom/ComponentCard";
import { SubstituteSheet } from "@/features/bom/SubstituteSheet";
import { compatibilityAlerts } from "@/features/bom/data";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  createProjectComponent,
  updateProjectComponent,
  deleteProjectComponent,
} from "@/lib/apis/project/client";
import { VisibilityBadge } from "@/components/VisibilityBadge";
import { CopyProjectModal } from "@/components/CopyProjectModal";
import { ProjectSettingsModal } from "@/components/ProjectSettingsModal";
import {
  ProjectCartSummary,
  ProjectComponentModel,
  ProjectTagEnum,
} from "@/lib/apis/project/types";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { StockStatus } from "@/lib/apis/inventory/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function BomProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const {
    components,
    originalComponents,
    hasUnsavedChanges,
    revertChanges,
    commitChanges,
    alerts,
    pdfReport,
    total,
    itemCount,
    loadProjectById,
    pushToCart,
    projectInfo,
    clearProject,
  } = useBom();
  const router = useRouter();
  const [needsFetch, setNeedsFetch] = useState(
    () => !projectInfo || projectInfo.id !== id,
  );
  const [sub, setSub] = useState<ProjectComponentModel | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [checkout, setCheckout] = useState<"idle" | "loading" | "done">("idle");
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!needsFetch || !id) return;
    loadProjectById(id)
      .then(() => setNeedsFetch(false))
      .catch(() => {
        setNotFound(true);
        setNeedsFetch(false);
      });
  }, [needsFetch, id, loadProjectById]);

  const pdfUrlRef = useRef<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
    }
    if (pdfReport) {
      const url = URL.createObjectURL(pdfReport);
      pdfUrlRef.current = url;
      setPdfUrl(url);
    } else {
      pdfUrlRef.current = null;
      setPdfUrl("/reports/document.pdf");
    }
  }, [pdfReport]);

  const handleGoToProjects = () => {
    clearProject();
    router.push("/bom");
  };

  const handleCheckout = async () => {
    setCheckout("loading");

    const project = projectInfo;
    if (project && project.id) {
      try {
        const deletes = originalComponents.filter(
          (oc) => !components.some((c) => c.id === oc.id),
        );
        const creates = components.filter(
          (c) => !originalComponents.some((oc) => oc.id === c.id),
        );
        const updates = components.filter((c) => {
          const oc = originalComponents.find((o) => o.id === c.id);
          if (!oc) return false;
          return (
            c.qty !== oc.qty ||
            c.inventoryId !== oc.inventoryId ||
            c.unitPrice !== oc.unitPrice ||
            c.name !== oc.name ||
            c.partNumber !== oc.partNumber ||
            c.shortDesc !== oc.shortDesc
          );
        });

        await Promise.all(
          deletes.map((c) => deleteProjectComponent(project.id!, c.id)),
        );
        await Promise.all(
          creates.map((c) => {
            const {
              projectId,
              createdAt,
              updatedAt,
              stock,
              stockCount,
              ...rest
            } = c;
            return createProjectComponent(project.id!, rest as any);
          }),
        );
        await Promise.all(
          updates.map((c) => {
            const {
              id,
              projectId,
              createdAt,
              updatedAt,
              stock,
              stockCount,
              ...rest
            } = c;
            return updateProjectComponent(project.id!, c.id, rest as any);
          }),
        );

        commitChanges();
      } catch (e) {
        console.error("Failed to sync changes", e);
      }

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
      const summary: Omit<ProjectCartSummary, "totalPrice"> = {
        id: `dynamic-${Date.now()}`,
        name: projectInfo?.name ?? "Project",
        tag: ProjectTagEnum.NA,
        timestamp: new Date().toLocaleString(),
        items: components.map((item) => ({
          ...item,
          qtyPrice: item.unitPrice * item.qty,
        })),
      };
      pushToCart(summary);
    }

    setCheckout("done");
    setTimeout(() => {
      setCheckout("idle");
      router.push("/cart");
    }, 1000);
  };

  if (notFound) {
    return (
      <div className="flex flex-col items-center gap-4 px-5 pt-20 pb-48 text-center">
        <p className="text-lg font-semibold text-foreground">Project not found</p>
        <p className="text-sm text-muted-foreground">
          This project may have been deleted or you don&apos;t have access.
        </p>
        <button
          onClick={() => router.push("/bom")}
          className="mt-2 rounded-full border border-white/10 px-4 py-2 text-sm transition-colors hover:border-foreground"
        >
          Back to projects
        </button>
      </div>
    );
  }

  if (needsFetch || !projectInfo) {
    return (
      <div className="flex items-center justify-center px-5 pt-40 pb-48">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 px-5 pt-2 pb-48">
        <header className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <button
              onClick={handleGoToProjects}
              className="mb-2 flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <ArrowRight size={12} className="rotate-180" />
              Back
            </button>
            <PageHeader
              trail={[
                { label: "BOM", onClick: handleGoToProjects },
                { label: projectInfo.name },
              ]}
              showBack={false}
            />
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <VisibilityBadge isPublic={!!projectInfo.isPublic} />
              <span>
                {components.length} components · {itemCount} units
              </span>
              {projectInfo.authorAlias ? (
                <span className="text-muted-foreground/70">
                  by {projectInfo.authorAlias}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCopyOpen(true)}
              title="Copy to a new private project"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={() => router.push(`/flow?projectId=${projectInfo.id}`)}
              title="Open in Flow"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <GitBranch size={16} />
            </button>
            <button
              onClick={() => setIsPdfOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <FileText size={16} />
            </button>
            {projectInfo.id && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                title="Project settings"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                <Settings size={16} />
              </button>
            )}
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
                ...alerts,
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
                <div className="flex items-center gap-2">
                  <AnimatePresence>
                    {hasUnsavedChanges && !hasIssues && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        onClick={revertChanges}
                        className={cn(
                          "flex h-11 w-11 shrink-0",
                          "items-center justify-center rounded-full",
                          "bg-destructive/10 p-0 text-destructive ring-1 ring-destructive/20 transition-colors hover:bg-destructive/20",
                        )}
                      >
                        <X size={20} />
                      </motion.button>
                    )}
                  </AnimatePresence>
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
                          {hasIssues ? (
                            "Fix issues to proceed"
                          ) : (
                            <>
                              <AnimatePresence mode="wait" initial={false}>
                                {hasUnsavedChanges ? (
                                  <motion.span
                                    key="cart-icon"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="flex items-center justify-center"
                                  >
                                    <ShoppingCart size={20} />
                                  </motion.span>
                                ) : (
                                  <motion.span
                                    key="cart-text"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center"
                                  >
                                    Push to cart
                                  </motion.span>
                                )}
                              </AnimatePresence>
                              <ArrowRight size={16} />
                            </>
                          )}
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
                          <Loader2 size={16} className="animate-spin" />{" "}
                          Pushing…
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
                </div>
              );
            })()}
          </motion.div>
        </div>

        <SubstituteSheet
          component={sub}
          projectName={projectInfo.name}
          onClose={() => setSub(null)}
        />

        {projectInfo.id && (
          <ProjectSettingsModal
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            project={{
              id: projectInfo.id,
              name: projectInfo.name,
              isPublic: !!projectInfo.isPublic,
              isOwner: projectInfo.isOwner !== false,
              authorAlias: projectInfo.authorAlias,
            }}
            pdfUrl={pdfUrl}
            onProjectsChanged={async () => {
              // Reload current project via store
              if (id) {
                await loadProjectById(id);
              }
            }}
            onOpenPreview={() => {
              setIsPdfOpen(true);
            }}
          />
        )}

        <CopyProjectModal
          open={isCopyOpen}
          onOpenChange={setIsCopyOpen}
          projectId={projectInfo.id!}
          defaultName={`Copy of ${projectInfo.name}`}
          onCopied={(_name: string, copiedId: string) => {
            router.push(`/bom/${copiedId}`);
          }}
        />

        <Dialog open={isPdfOpen} onOpenChange={setIsPdfOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Specs Calculation Report</DialogTitle>
            </DialogHeader>
            <div className="flex h-96 items-center justify-center rounded-lg border border-dashed border-white/10 overflow-hidden">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="h-full w-full"
                  title="Specs Calculation Report"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No PDF generated
                </p>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 mt-4">
              <span className="rounded-full border border-white/50 bg-white/8 px-2.5 py-0.5 text-xs font-medium text-white">
                AI Generated
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsPdfOpen(false)}>
                  Close
                </Button>
                <a
                  href={pdfUrl || "#"}
                  download={`${projectInfo.name}_Report.pdf`}
                  className={cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2",
                    !pdfUrl && "pointer-events-none opacity-50",
                  )}
                >
                  <Download size={16} className="mr-2" />
                  Download
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
