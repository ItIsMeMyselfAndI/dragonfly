"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  ExternalLink,
  Package,
  Clock,
  Zap,
  ShoppingCart,
} from "lucide-react";
import { useBom } from "../../features/bom/store";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { allProjects, categoryIcons } from "@/lib/projects";

export default function CartScreen() {
  const { items, total, itemCount } = useBom();
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(allProjects[0]);

  const handleProjectClick = (project: (typeof allProjects)[0]) => {
    setSelectedProject(project);
    setIsListModalOpen(false);
    setIsSummaryModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-5 px-5 pt-14 pb-48">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Distributor
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Cart pushed
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-2"
          onClick={() => setIsListModalOpen(true)}
        >
          <ShoppingCart size={16} />
          Projects
        </Button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 rounded-3xl border border-primary/30 bg-primary/10 p-4 glow-soft"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Check size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">
            Synced with DigiKey
          </p>
          <p className="text-[11px] text-foreground/70">
            {itemCount} units · ready in your distributor cart
          </p>
        </div>
      </motion.div>

      <div className="rounded-3xl border border-white/5 bg-surface/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Summary
          </p>
          <Package size={14} className="text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          {items.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="min-w-0 truncate text-foreground/90">
                {c.qty} × {c.name}
              </span>
              <span className="ml-3 shrink-0 font-mono tabular-nums text-muted-foreground">
                ₱{(c.qty * c.unitPrice).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="my-4 h-px bg-white/5" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-mono text-lg font-semibold tabular-nums">
            ₱{total.toFixed(2)}
          </span>
        </div>
      </div>

      <motion.a
        whileTap={{ scale: 0.97 }}
        href="#"
        className="glow-primary flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-semibold text-primary-foreground"
      >
        Open distributor cart <ExternalLink size={16} />
      </motion.a>
      <Link
        href="/"
        className="text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Start a new project
      </Link>

      {/* Modal 1: Project List */}
      <Dialog open={isListModalOpen} onOpenChange={setIsListModalOpen}>
        <DialogContent className="max-w-[440px] bg-surface border-white/10">
          <DialogHeader>
            <DialogTitle>Recent Projects</DialogTitle>
            <DialogDescription>
              Select a project to view its cart summary.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4">
            {allProjects.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between rounded-2xl bg-surface-elevated py-2 px-4 ring-1 ring-white/5"
              >
                <div
                  className="flex flex-1 items-center justify-between cursor-pointer transition-colors hover:bg-white/5 p-2 rounded-xl"
                  onClick={() => handleProjectClick(p)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {(() => {
                        const Icon = categoryIcons[p.tag] || Zap;
                        return <Icon size={18} />;
                      })()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ₱{p.cost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {p.tag}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={12} /> {p.time}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 rounded-full text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(`Pushing ${p.name} to distributor cart...`);
                    setIsListModalOpen(false);
                  }}
                >
                  <ShoppingCart size={16} />
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Cart Summary */}
      <Dialog open={isSummaryModalOpen} onOpenChange={setIsSummaryModalOpen}>
        <DialogContent className="max-w-[440px] bg-surface border-white/10">
          <DialogHeader>
            <DialogTitle>{selectedProject.name} Summary</DialogTitle>
            <DialogDescription>
              Cart total: ₱{selectedProject.cost.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2">
              {selectedProject.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground/90">
                    {item.qty} × {item.name}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="font-mono tabular-nums text-foreground/90">
                      ₱{(item.qty * item.unitPrice).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      @ ₱{item.unitPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="my-2 h-px bg-white/5" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                Project Total
              </span>
              <span className="font-mono text-lg font-semibold tabular-nums">
                ₱{selectedProject.cost.toFixed(2)}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
