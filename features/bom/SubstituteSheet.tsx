import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, Check, X, Info } from "lucide-react";
import { substitutesFor } from "./data";
import { useBom } from "./store";
import { useSheet } from "@/lib/sheet-context";
import { useEffect, useMemo, useState } from "react";
import { getAllItems } from "@/lib/apis/inventory/client";
import { getAllProjects, getProjectSubstitutes } from "@/lib/apis/project/client";
import { StockStatus, ItemDetails, MountType } from "@/lib/apis/inventory/types";
import { ProjectComponentModel } from "@/lib/apis/project/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SubstituteSheet({
  component,
  projectName,
  onClose,
}: {
  component: ProjectComponentModel | null;
  projectName: string | null;
  onClose: () => void;
}) {
  const { swap } = useBom();
  const [inventory, setInventory] = useState<any[]>([]);
  const [projectSubsData, setProjectSubsData] = useState<any[]>([]);
  const [detailOpen, setDetailOpen] = useState<string | null>(null);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const components = await getAllItems();
        setInventory(components);
      } catch (err) {
        console.error("Failed to load inventory for substitutes:", err);
      }
    };
    loadInventory();
  }, []);

  useEffect(() => {
    const loadProjectSubstitutes = async () => {
      if (!projectName || !component) return;

      try {
        const projects = await getAllProjects();
        const project = projects.find((p) => p.name === projectName);

        if (project) {
          const subs = await getProjectSubstitutes(project.id);
          const componentSubs = subs.filter(
            (s) => s.originalComponentId === component.id,
          );
          setProjectSubsData(componentSubs);
        }
      } catch (err) {
        console.error("Failed to load project substitutes:", err);
      }
    };
    loadProjectSubstitutes();
  }, [projectName, component]);

  const projectSubs = useMemo(() => {
    if (!component || projectSubsData.length === 0 || inventory.length === 0)
      return [];

    return projectSubsData
      .map((sub) =>
        inventory.find((item) => item.id === sub.substituteComponentId),
      )
      .filter((item): item is any => !!item)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        partNumber: c.partNumber,
        shortDesc: c.shortDesc,
        unitPrice: c.unitPrice,
        category: c.category,
        pins: c.pins,
        details: c.details,
        matchScore: 100, // Project-approved
        note: "Project-approved substitute.",
      }));
  }, [component, projectSubsData, inventory]);

  const explicitSubs = component ? (substitutesFor[component.id] ?? []) : [];

  const compatibleSubs = useMemo(() => {
    if (
      !component ||
      projectSubs.length > 0 ||
      explicitSubs.length > 0 ||
      inventory.length === 0
    )
      return [];

    // Find alternatives in inventory: same category, different ID, in-stock
    return inventory
      .filter(
        (c) =>
          c.category === component.category &&
          c.id !== component.id &&
          c.stock === StockStatus.IN_STOCK,
      )
      .map((c) => ({
        id: c.id,
        name: c.name,
        partNumber: c.partNumber,
        shortDesc: c.shortDesc,
        unitPrice: c.unitPrice,
        matchScore: 85, // Default score for inferred substitutes
        note: "Automatically found in-stock alternative.",
        details: c.details,
      }));
  }, [component, projectSubs, explicitSubs, inventory]);

  const subs =
    projectSubs.length > 0
      ? projectSubs
      : explicitSubs.length > 0
        ? explicitSubs
        : compatibleSubs;

  useEffect(() => {
    if (subs.length === 1 && component) {
      swap(component.id, {
        id: component.id,
        projectId: component.projectId,
        inventoryId: subs[0].id,
        name: subs[0].name,
        partNumber: subs[0].partNumber,
        shortDesc: subs[0].shortDesc,
        unitPrice: subs[0].unitPrice,
        stock: StockStatus.IN_STOCK,
        stockCount: 8400,
        category: component.category,
        pins: component.pins,
        details: subs[0].details,
      });
      onClose();
    }
  }, [subs, component, swap, onClose]);

  const { setIsSheetOpen } = useSheet();

  useEffect(() => {
    setIsSheetOpen(!!component);
  }, [component, setIsSheetOpen]);

  return (
    <AnimatePresence>
      {component && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-999 mx-auto max-w-[440px] bg-black/50 backdrop-blur-md"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => info.offset.y > 100 && onClose()}
            className="glass-strong fixed inset-x-0 bottom-0 z-[1000] mx-auto max-w-[440px] rounded-t-3xl border-t border-white/10 px-5 pb-8 pt-3"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/15" />
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-primary">
                  Smart substitute
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight">
                  Replace {component.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Matched on electrical specs and footprint.
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto max-h-[70vh] pr-1">
              {subs.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-white/5 bg-surface/80 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{s.name}</p>
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {s.matchScore}% match
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {s.partNumber}
                      </p>
                      <p className="mt-2 text-xs text-foreground/80">
                        {s.shortDesc}
                      </p>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {s.note}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <p className="shrink-0 font-mono text-sm text-foreground">
                        ₱{s.unitPrice.toFixed(2)}
                      </p>
                      {s.details && (
                        <button
                          onClick={() => setDetailOpen(s.id)}
                          className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          <Info size={12} />
                          VIEW SPECS
                        </button>
                      )}
                    </div>
                  </div>
                  {s.details && (
                    <Dialog open={detailOpen === s.id} onOpenChange={(open) => !open && setDetailOpen(null)}>
                        <DialogContent className="max-h-[60vh] overflow-y-auto bg-surface border-white/10">
                          <DialogHeader>
                            <DialogTitle>{s.name}</DialogTitle>
                            <DialogDescription>{s.partNumber}</DialogDescription>
                          </DialogHeader>
                          <SpecGrid d={s.details} category={component.category} />
                        </DialogContent>
                    </Dialog>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      swap(component.id, {
                        id: component.id,
                        projectId: component.projectId,
                        inventoryId: s.id,
                        name: s.name,
                        partNumber: s.partNumber,
                        shortDesc: s.shortDesc,
                        unitPrice: s.unitPrice,
                        stock: StockStatus.IN_STOCK,
                        stockCount: 8400,
                        category: component.category,
                        pins: component.pins,
                        details: s.details,
                      });
                      onClose();
                    }}
                    className="glow-primary mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
                  >
                    <ArrowLeftRight size={16} />
                    Swap component
                  </motion.button>
                </div>
              ))}
              {subs.length === 0 && (
                <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface/60 px-4 py-10 text-center">
                  <Check className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No substitutes needed.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className="truncate font-mono text-[11px] text-foreground/90">
        {value}
      </span>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-1.5">
      <p className="mb-1 mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-primary/80">
        {title}
      </p>
      <div className="divide-y divide-white/[0.04]">{children}</div>
    </div>
  );
}

function SpecGrid({
  d,
  category,
}: {
  d: ItemDetails;
  category: string;
}) {
  const v =
    d.voltageMin !== undefined && d.voltageMax !== undefined
      ? `${d.voltageMin}–${d.voltageMax} V`
      : undefined;
  return (
    <div className="mt-3 flex flex-col gap-2">
      <Group title="Universal">
        <Row label="Mounting" value={d.mounting} />
        <Row label="Package" value={d.package} />
        <Row label="Vcc range" value={v} />
      </Group>
      {category === "Passive" && (
        <Group title="Passive">
          <Row label="Value" value={d.primaryValue} />
          <Row label="Rating" value={d.powerRating} />
          <Row label="Tolerance" value={d.tolerance} />
        </Group>
      )}
      {(category === "MCU" ||
        category === "Logic" ||
        category === "Sensor") && (
        <Group title="Integrated circuit">
          <Row label="Logic family" value={d.logicFamily} />
          <Row
            label="I/O voltage"
            value={d.ioVoltage !== undefined ? `${d.ioVoltage} V` : undefined}
          />
          <Row label="Pin count" value={d.pinCount} />
          <Row label="Max current" value={d.maxCurrent} />
        </Group>
      )}
      {category === "Actuator" && (
        <Group title="Electromechanical">
          <Row
            label="Nominal V"
            value={
              d.nominalVoltage !== undefined
                ? `${d.nominalVoltage} V`
                : undefined
            }
          />
          <Row label="Current draw" value={d.currentDraw} />
          <Row label="Contact rating" value={d.contactRating} />
        </Group>
      )}
      {category === "Power" && (
        <Group title="Power">
          <Row
            label="Nominal V"
            value={
              d.nominalVoltage !== undefined
                ? `${d.nominalVoltage} V`
                : undefined
            }
          />
          <Row label="Capacity" value={d.currentDraw} />
          <Row label="Contact rating" value={d.contactRating} />
        </Group>
      )}
      {(d.forwardVoltage || d.thresholdVoltage) && (
        <Group title="Semiconductor">
          <Row label="V forward" value={d.forwardVoltage} />
          <Row label="V threshold" value={d.thresholdVoltage} />
          <Row label="Max current" value={d.maxCurrent} />
        </Group>
      )}
    </div>
  );
}
