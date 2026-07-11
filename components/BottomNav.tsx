"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ListChecks, GitBranch, ShoppingBag } from "lucide-react";
import { useSheet } from "@/lib/sheet-context";
import { useNavigate } from "@/components/navigation/NavigationGuard";

const tabs = [
  { href: "/", label: "Inspire", icon: Sparkles },
  { href: "/bom", label: "BOM", icon: ListChecks },
  { href: "/flow", label: "Flow", icon: GitBranch },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { isSheetOpen } = useSheet();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {!isSheetOpen && (
        <motion.nav
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[440px] justify-center px-5 pb-5"
        >
          <div className="glass-strong pointer-events-auto flex w-full items-center justify-around rounded-full border border-white/5 px-3 py-2 glow-soft">
            {tabs.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(href);
                  }}
                  className={`relative flex flex-col items-center justify-center transition-all duration-300 ${
                    active ? "-mt-6" : "h-12 w-12"
                  }`}
                >
                  <div className="relative flex flex-col items-center justify-center">
                    {active && (
                      <div className="absolute -inset-1.5 rounded-full glass border border-white/10 -z-10 glow-soft" />
                    )}
                    <div
                      className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                        active
                          ? "bg-primary ring-4 ring-transparent"
                          : "h-12 w-12 bg-transparent"
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="nav-pill"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 32,
                          }}
                          className="absolute inset-0 rounded-full bg-primary"
                        />
                      )}
                      <Icon
                        size={20}
                        className={`relative z-10 transition-colors ${
                          active
                            ? "text-primary-foreground"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                  </div>
                  <span
                    className={`mt-1 text-[10px] font-bold tracking-wide transition-colors ${
                      active ? "text-primary" : "hidden"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
