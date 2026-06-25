"use client";

import { motion } from "framer-motion";
import { Check, ExternalLink, Package } from "lucide-react";
import { useBom } from "../../features/bom/store";
import Link from "next/link";

export default function CartScreen() {
  const { items, total, itemCount } = useBom();

  return (
    <div className="flex flex-col gap-5 px-5 pt-14 pb-48">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Distributor
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Cart pushed
        </h1>
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
    </div>
  );
}
