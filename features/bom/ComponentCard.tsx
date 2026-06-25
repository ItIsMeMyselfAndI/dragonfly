import { motion } from "framer-motion";
import { Info, Minus, Plus, Sparkles, AlertTriangle } from "lucide-react";
import { useState } from "react";
import type { Component, ComponentDetails } from "./data";
import { useBom } from "./store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const stockMeta = {
  "in-stock": { label: "In stock", className: "bg-success/15 text-success ring-success/30" },
  low: { label: "Low stock", className: "bg-warning/15 text-warning ring-warning/30" },
  out: { label: "Out of stock", className: "bg-destructive/15 text-destructive ring-destructive/30" },
} as const;

export function ComponentCard({
  c,
  onFindSubstitute,
}: {
  c: Component;
  onFindSubstitute: (c: Component) => void;
}) {
  const { setQty } = useBom();
  const isOut = c.stock === "out";
  const [open, setOpen] = useState(false);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border bg-surface/70 p-4 backdrop-blur-sm ${
        isOut ? "border-destructive/40" : "border-white/5"
      }`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{c.name}</p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${stockMeta[c.stock].className}`}
            >
              {stockMeta[c.stock].label}
            </span>
          </div>
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
            {c.partNumber} · {c.category}
          </p>
          <p className="mt-2 text-xs text-foreground/80">{c.specs}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <p className="shrink-0 font-mono text-sm">₱{c.unitPrice.toFixed(2)}</p>

          {c.details && (
            <>
              <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-white/[0.03] px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <Info size={12} />
                <span className="uppercase tracking-[0.16em]">SPECS</span>
              </button>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-surface border-white/10">
                  <DialogHeader>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-base font-semibold">{c.name}</DialogTitle>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${stockMeta[c.stock].className}`}
                      >
                        {stockMeta[c.stock].label}
                      </span>
                    </div>
                    <DialogDescription className="font-mono text-[11px] text-muted-foreground">
                      {c.partNumber} · {c.category}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-2">
                    <SpecGrid d={c.details} category={c.category} />
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </header>

      <footer className="mt-4 flex items-center justify-between gap-3">
        {isOut ? (
          <button
            onClick={() => onFindSubstitute(c)}
            className="flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-2 text-xs font-medium text-destructive ring-1 ring-destructive/30"
          >
            <AlertTriangle size={13} />
            Find substitute
          </button>
        ) : (
          <button
            onClick={() => onFindSubstitute(c)}
            className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <Sparkles size={12} />
            Alternatives
          </button>
        )}

        <div className="flex items-center gap-2 rounded-full bg-white/[0.04] p-1">
          <button
            onClick={() => setQty(c.id, c.qty - 1)}
            disabled={c.qty <= 0}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated text-muted-foreground disabled:opacity-40"
          >
            <Minus size={14} />
          </button>
          <span className="w-6 text-center font-mono text-sm tabular-nums">{c.qty}</span>
          <button
            onClick={() => setQty(c.id, c.qty + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Plus size={14} />
          </button>
        </div>
      </footer>
    </motion.article>
  );
}

function Row({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <span className="truncate font-mono text-[11px] text-foreground/90">{value}</span>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-1.5">
      <p className="mb-1 mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-primary/80">
        {title}
      </p>
      <div className="divide-y divide-white/[0.04]">{children}</div>
    </div>
  );
}

function SpecGrid({ d, category }: { d: ComponentDetails; category: Component["category"] }) {
  const v = `${d.voltageMin}–${d.voltageMax} V`;
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
      {(category === "MCU" || category === "Logic" || category === "Sensor") && (
        <Group title="Integrated circuit">
          <Row label="Logic family" value={d.logicFamily} />
          <Row label="I/O voltage" value={d.ioVoltage !== undefined ? `${d.ioVoltage} V` : undefined} />
          <Row label="Pin count" value={d.pinCount} />
          <Row label="Max current" value={d.maxCurrent} />
        </Group>
      )}
      {category === "Actuator" && (
        <Group title="Electromechanical">
          <Row label="Nominal V" value={d.nominalVoltage !== undefined ? `${d.nominalVoltage} V` : undefined} />
          <Row label="Current draw" value={d.currentDraw} />
          <Row label="Contact rating" value={d.contactRating} />
        </Group>
      )}
      {category === "Power" && (
        <Group title="Power">
          <Row label="Nominal V" value={d.nominalVoltage !== undefined ? `${d.nominalVoltage} V` : undefined} />
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