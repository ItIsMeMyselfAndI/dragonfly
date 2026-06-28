"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ExternalLink, Package, Zap, ShoppingCart } from "lucide-react";
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
import { categoryIcons } from "@/lib/project/constants";
import { ProjectCost } from "@/components/ProjectCost";

export default function CartScreen() {
  const { pushedHistory, moveToLastCart } = useBom();
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  const lastCart = pushedHistory[pushedHistory.length - 1];

  const handleMoveToLastCart = (index: number) => {
    moveToLastCart(index);
    setIsListModalOpen(false);
  };

  if (!lastCart) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-5 pt-14 pb-48 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-surface/60 text-muted-foreground">
          <ShoppingCart size={40} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Cart empty</h1>
        <p className="text-sm text-muted-foreground">
          Push a project from the BOM manager to get started.
        </p>
        <Link
          href="/bom"
          className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Go to BOM Manager
        </Link>
      </div>
    );
  }

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
          History
        </Button>
      </header>

      <div className="rounded-3xl border border-white/5 bg-surface/60 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
          Project Info
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            {lastCart.name}
          </span>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {lastCart.tag}
          </span>
        </div>
      </div>

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
            {lastCart.items.reduce((sum, item) => sum + item.qty, 0)} units ·
            ready in your distributor cart
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
          {lastCart.items.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between text-sm gap-2"
            >
              <div className="flex-1 min-w-0 flex items-baseline truncate">
                <span className="font-semibold shrink-0">{c.qty} ×</span>
                <span className="truncate ml-1">{c.name}</span>
                <span className="text-muted-foreground text-xs ml-1 shrink-0">
                  (@₱{c.unitPrice.toFixed(2)})
                </span>
              </div>
              <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                ₱{c.qtyPrice.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="my-4 h-px bg-white/5" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-mono text-lg font-semibold tabular-nums">
            ₱{lastCart.totalPrice.toFixed(2)}
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

      {/* Modal: History */}
      <Dialog open={isListModalOpen} onOpenChange={setIsListModalOpen}>
        <DialogContent className="max-w-[360px] bg-surface border-white/10">
          <DialogHeader>
            <DialogTitle>Pushed History</DialogTitle>
            <DialogDescription>
              Select a previous project to view details.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4">
            {pushedHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No history yet.
              </p>
            ) : (
              pushedHistory.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl bg-surface-elevated py-2 px-4 ring-1 ring-white/5"
                >
                  <div className="flex flex-1 items-center justify-between transition-colors p-2 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        {(() => {
                          const Icon =
                            categoryIcons[
                              p.tag.toLowerCase() as keyof typeof categoryIcons
                            ] || Zap;
                          return <Icon size={18} />;
                        })()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          <ProjectCost project={p} />
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 rounded-full cursor-pointer text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveToLastCart(i);
                    }}
                  >
                    <ShoppingCart size={16} />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
