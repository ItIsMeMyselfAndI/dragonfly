"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAllProjects, getProjectNodes } from "@/lib/project/client";
import { getAllComponents } from "@/lib/inventory/client";
import { type ProjectCartSummary } from "@/lib/project-calculator";
import { Component } from "@/lib/inventory/types";
import { ProjectTag } from "@/lib/project/types";
import { type BomAlert } from "@/features/bom/data";


interface BomStore {
  items: Component[];
  alerts: BomAlert[];
  total: number;
  itemCount: number;
  projectInfo: { name: string; tag: ProjectTag } | null;
  pushedHistory: ProjectCartSummary[];
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  swap: (id: string, next: Omit<Component, "qty">) => void;
  loadProject: (projectName: string) => Promise<void>;
  loadDynamicProject: (
    projectName: string,
    newItems: Component[],
    newAlerts?: BomAlert[],
  ) => void;
  pushToCart: (summary: Omit<ProjectCartSummary, "totalPrice">) => void;
  moveToLastCart: (index: number) => void;
}

const Ctx = createContext<BomStore | null>(null);

export function BomProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Component[]>([]);
  const [alerts, setAlerts] = useState<BomAlert[]>([]);
  const [projectInfo, setProjectInfo] = useState<{
    name: string;
    tag: ProjectTag;
  } | null>(null);
  const [pushedHistory, setPushedHistory] = useState<ProjectCartSummary[]>([]);

  const loadProject = async (projectName: string) => {
    const projects = await getAllProjects();
    const project = projects.find((p) => p.name === projectName);
    if (!project) return;

    setProjectInfo({ name: project.name, tag: project.tag });

    const nodes = await getProjectNodes(project.id);
    const allInventory = await getAllComponents();
    const components = nodes
      .map((node) => node.componentId)
      .map((id) => allInventory.find((item) => item.id === id))
      .filter((item): item is Component => !!item);

    setItems(components);
    setAlerts([]); // Clear dynamic alerts when loading from API
  };

  const loadDynamicProject = (
    projectName: string,
    newItems: Component[],
    newAlerts: BomAlert[] = [],
  ) => {
    setProjectInfo({ name: projectName, tag: "AI Generated" });
    setItems(newItems);
    setAlerts(newAlerts);
  };
  const pushToCart = useCallback(
    (summary: Omit<ProjectCartSummary, "totalPrice">) => {
      const totalPrice = summary.items.reduce((s, i) => s + i.qtyPrice, 0);
      const fullSummary: ProjectCartSummary = { ...summary, totalPrice };
      setPushedHistory((prev) => [...prev, fullSummary]);
    },
    [],
  );
  const moveToLastCart = useCallback(
    (index: number) =>
      setPushedHistory((prev) => {
        if (index < 0 || index >= prev.length) return prev;
        const item = prev[index];
        const newHistory = prev.filter((_, i) => i !== index);
        return [...newHistory, item];
      }),
    [],
  );

  const value = useMemo<BomStore>(() => {
    const total = (items || []).reduce(
      (s, i) => s + (i.unitPrice || 0) * (i.qty || 1),
      0,
    );
    const itemCount = (items || []).reduce((s, i) => s + (i.qty || 1), 0);
    return {
      items: items || [],
      alerts: alerts || [],
      total,
      itemCount,
      projectInfo,
      pushedHistory,
      setQty: (id, qty) =>
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, qty) } : i)),
        ),
      remove: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
      swap: (id, next) =>
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...next, qty: i.qty } : i)),
        ),
      loadProject: async (name) => await loadProject(name),
      loadDynamicProject,
      pushToCart,
      moveToLastCart,
    };
  }, [items, alerts, projectInfo, pushedHistory, pushToCart, moveToLastCart]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBom() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useBom outside provider");
  return v;
}
