"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/features/auth/store";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAllProjects } from "@/lib/apis/project/client";
import { ProjectTagEnum, type ProjectModel } from "@/lib/apis/project/types";
import { ProjectCard } from "@/components/ProjectCard";
import { PageHeader } from "@/components/PageHeader";

type BomTab = ProjectTagEnum | "all";

const TABS: { id: BomTab; label: string }[] = [
  { id: "all", label: "All" },
  ...Object.values(ProjectTagEnum).map((tag) => ({ id: tag as BomTab, label: tag })),
];

export default function BomScreen() {
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [tab, setTab] = useState<BomTab>("all");
  const router = useRouter();

  const { user } = useAuth();
  const requesterKey = user?.id ?? "guest";

  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth);
  }, []);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState]);

  const scrollTabs = (dir: "left" | "right") => {
    const el = tabsRef.current;
    if (!el) return;
    const amount = dir === "left" ? -el.clientWidth : el.clientWidth;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  useEffect(() => {
    async function init() {
      try {
        const data = await getAllProjects();
        setProjects(data);
      } catch (e) {
        console.error("Failed to initialize BOM screen", e);
      }
    }
    init();
  }, [requesterKey]);

  const handleSelectProject = (projectId: string) => {
    router.push(`/bom/${projectId}`);
  };

  const filteredProjects =
    tab === "all" ? projects : projects.filter((p) => p.tag === tab);

  return (
    <div className="flex flex-col gap-4 px-5 pt-2 pb-48">
      <PageHeader trail={[{ label: "BOM" }]} />

      <div className="relative">
        <div
          ref={tabsRef}
          className="flex gap-1 overflow-x-auto rounded-xl bg-surface/60 p-1 ring-1 ring-white/5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {canScrollLeft && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 rounded-l-xl bg-gradient-to-r from-surface/90 to-transparent" />
            <button
              type="button"
              aria-label="Scroll tabs left"
              onClick={() => scrollTabs("left")}
              className="absolute left-0.5 top-1/2 z-20 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-surface/60 backdrop-blur-sm text-muted-foreground ring-1 ring-white/10 transition-all hover:bg-surface hover:text-foreground hover:ring-primary/40 hover:shadow-lg hover:shadow-primary/20"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        )}
        {canScrollRight && (
          <>
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 rounded-r-xl bg-gradient-to-l from-surface/90 to-transparent" />
            <button
              type="button"
              aria-label="Scroll tabs right"
              onClick={() => scrollTabs("right")}
              className="absolute right-0.5 top-1/2 z-20 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-surface/60 backdrop-blur-sm text-muted-foreground ring-1 ring-white/10 transition-all hover:bg-surface hover:text-foreground hover:ring-primary/40 hover:shadow-lg hover:shadow-primary/20"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {filteredProjects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            onSelect={() => handleSelectProject(p.id)}
          />
        ))}
      </div>
    </div>
  );
}
