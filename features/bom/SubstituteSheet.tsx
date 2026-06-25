import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, Check, X } from "lucide-react";
import { substitutesFor, type Component } from "./data";
import { useBom } from "./store";
import { useSheet } from "@/lib/sheet-context";
import { useEffect } from "react";

export function SubstituteSheet({
  component,
  onClose,
}: {
  component: Component | null;
  onClose: () => void;
}) {
  const { swap } = useBom();
  const subs = component ? substitutesFor[component.id] ?? [] : [];
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
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Smart substitute</p>
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

            <div className="flex flex-col gap-3">
              {subs.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-white/5 bg-surface/80 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{s.name}</p>
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {s.matchScore}% match
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{s.partNumber}</p>
                      <p className="mt-2 text-xs text-foreground/80">{s.specs}</p>
                      <p className="mt-2 text-[11px] text-muted-foreground">{s.note}</p>
                    </div>
                    <p className="shrink-0 font-mono text-sm text-foreground">
                      ₱{s.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      swap(component.id, {
                        id: component.id,
                        name: s.name,
                        partNumber: s.partNumber,
                        specs: s.specs,
                        unitPrice: s.unitPrice,
                        stock: "in-stock",
                        stockCount: 8400,
                        category: component.category,
                        pins: component.pins,
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
                  <p className="text-sm text-muted-foreground">No substitutes needed.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}