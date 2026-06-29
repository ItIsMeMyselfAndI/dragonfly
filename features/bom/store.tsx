"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAllProjects, getProjectComponents } from "@/lib/project/client";
import { ItemModel, StockStatus } from "@/lib/inventory/types";
import {
  ProjectCartSummary,
  ProjectTagEnum,
  ProjectComponentModel,
} from "@/lib/project/types";
import { BomAlert } from "./data";
import { getAllItems } from "@/lib/inventory/client";

interface BomStore {
  components: ProjectComponentModel[];
  alerts: BomAlert[];
  total: number;
  itemCount: number;
  projectInfo: { name: string; tag: ProjectTagEnum } | null;
  pushedHistory: ProjectCartSummary[];
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  swap: (id: string, next: Omit<ProjectComponentModel, "qty">) => void;
  loadProject: (projectName: string) => Promise<void>;
  loadDynamicProject: (
    projectName: string,
    tag: ProjectTagEnum,
    newComponents: ProjectComponentModel[],
    newAlerts?: BomAlert[],
  ) => void;
  pushToCart: (summary: Omit<ProjectCartSummary, "totalPrice">) => void;
  moveToLastCart: (index: number) => void;
}

const Ctx = createContext<BomStore | null>(null);

export function BomProvider({ children }: { children: ReactNode }) {
  const [components, setComponents] = useState<ProjectComponentModel[]>([]);
  const [alerts, setAlerts] = useState<BomAlert[]>([]);
  const [projectInfo, setProjectInfo] = useState<{
    name: string;
    tag: ProjectTagEnum;
  } | null>(null);
  const [pushedHistory, setPushedHistory] = useState<ProjectCartSummary[]>([]);

  const loadProject = async (projectName: string) => {
    const projects = await getAllProjects();
    const project = projects.find((p) => p.name === projectName);
    if (!project) return;

    setProjectInfo({ name: project.name, tag: project.tag });

    const components = await getProjectComponents(project.id);

    setComponents(components);
    setAlerts([]); // Clear dynamic alerts when loading from API
  };

  const loadDynamicProject = (
    projectName: string,
    tag: ProjectTagEnum,
    newComponents: ProjectComponentModel[],
    newAlerts: BomAlert[] = [],
  ) => {
    setProjectInfo({ name: projectName, tag });
    setComponents(newComponents);
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
    const total = (components || []).reduce(
      (s, i) => s + (i.unitPrice || 0) * (i.qty || 1),
      0,
    );
    const itemCount = (components || []).reduce((s, i) => s + (i.qty || 1), 0);
    return {
      components: components || [],
      alerts: alerts || [],
      total,
      itemCount,
      projectInfo,
      pushedHistory,
      setQty: (id, qty) =>
        setComponents((prev) =>
          prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, qty) } : i)),
        ),
      remove: (id) => setComponents((prev) => prev.filter((i) => i.id !== id)),
      swap: (id, next) =>
        setComponents((prev) =>
          prev.map((i) => (i.id === id ? { ...next, qty: i.qty } : i)),
        ),
      loadProject: async (name) => await loadProject(name),
      loadDynamicProject,
      pushToCart,
      moveToLastCart,
    };
  }, [
    components,
    alerts,
    projectInfo,
    pushedHistory,
    pushToCart,
    moveToLastCart,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBom() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useBom outside provider");
  return v;
}
