"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ProjectCartSummary,
  ProjectTagEnum,
  ProjectComponentModel,
} from "@/lib/apis/project/types";
import { BomAlert } from "./data";
import {
  getAllProjects,
  getProjectComponents,
} from "@/lib/apis/project/client";
import { getReportsByProjectId } from "@/lib/apis/project/reportClient";

interface BomStore {
  components: ProjectComponentModel[];
  originalComponents: ProjectComponentModel[];
  hasUnsavedChanges: boolean;
  alerts: BomAlert[];
  specs: any | null;
  pdfReport: Blob | null; // Added
  total: number;
  itemCount: number;
  projectInfo: { name: string; tag: ProjectTagEnum } | null;
  pushedHistory: ProjectCartSummary[];
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  swap: (id: string, next: Omit<ProjectComponentModel, "qty">) => void;
  revertChanges: () => void;
  commitChanges: () => void;
  clearProject: () => void;
  loadProject: (projectName: string) => Promise<void>;
  loadDynamicProject: (
    projectName: string,
    tag: ProjectTagEnum,
    newComponents: ProjectComponentModel[],
    newAlerts?: BomAlert[],
    newSpecs?: any,
    newPdfReport?: Blob | null, // Added
  ) => void;
  pushToCart: (summary: Omit<ProjectCartSummary, "totalPrice">) => void;
  moveToLastCart: (index: number) => void;
}

const Ctx = createContext<BomStore | null>(null);

export function BomProvider({ children }: { children: ReactNode }) {
  const [components, setComponents] = useState<ProjectComponentModel[]>([]);
  const [originalComponents, setOriginalComponents] = useState<
    ProjectComponentModel[]
  >([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [alerts, setAlerts] = useState<BomAlert[]>([]);
  const [specs, setSpecs] = useState<any | null>(null);
  const [pdfReport, setPdfReport] = useState<Blob | null>(null); // Added
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
    const reports = await getReportsByProjectId(project.id);
    const latestReport = reports.length > 0 ? reports[0] : null;

    setComponents(components);
    setOriginalComponents(components);
    setHasUnsavedChanges(false);
    setAlerts([]); // Clear dynamic alerts when loading from API
    setSpecs(latestReport?.report_data || null);

    if (latestReport?.pdf_url) {
      const response = await fetch(latestReport.pdf_url);
      const blob = await response.blob();
      setPdfReport(blob);
    } else {
      setPdfReport(null);
    }
  };

  const loadDynamicProject = (
    projectName: string,
    tag: ProjectTagEnum,
    newComponents: ProjectComponentModel[],
    newAlerts: BomAlert[] = [],
    newSpecs: any = null,
    newPdfReport: Blob | null = null, // Added
  ) => {
    setProjectInfo({ name: projectName, tag });
    setComponents(newComponents);
    setOriginalComponents(newComponents);
    setHasUnsavedChanges(false);
    setAlerts(newAlerts);
    setSpecs(newSpecs);
    setPdfReport(newPdfReport); // Added
  };

  const clearProject = useCallback(() => {
    setProjectInfo(null);
    setComponents([]);
    setOriginalComponents([]);
    setHasUnsavedChanges(false);
    setAlerts([]);
    setSpecs(null);
    setPdfReport(null);
  }, []);

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
      (s, i) => s + (i.unitPrice || 0) * (i.qty ?? 1),
      0,
    );
    const itemCount = (components || []).reduce((s, i) => s + (i.qty ?? 1), 0);
    return {
      components: components || [],
      originalComponents: originalComponents || [],
      hasUnsavedChanges,
      alerts: alerts || [],
      specs: specs,
      pdfReport: pdfReport, // Added
      total,
      itemCount,
      projectInfo,
      pushedHistory,
      setQty: (id, qty) => {
        setComponents((prev) =>
          prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, qty) } : i)),
        );
        setHasUnsavedChanges(true);
      },
      remove: (id) => {
        setComponents((prev) => prev.filter((i) => i.id !== id));
        setHasUnsavedChanges(true);
      },
      swap: (id, next) => {
        setComponents((prev) =>
          prev.map((i) => (i.id === id ? { ...next, qty: i.qty } : i)),
        );
        setHasUnsavedChanges(true);
      },
      revertChanges: () => {
        setComponents(originalComponents);
        setHasUnsavedChanges(false);
      },
      commitChanges: () => {
        setOriginalComponents(components);
        setHasUnsavedChanges(false);
      },
      clearProject: clearProject,
      loadProject: async (name) => await loadProject(name),
      loadDynamicProject,
      pushToCart,
      moveToLastCart,
    };
  }, [
    components,
    originalComponents,
    hasUnsavedChanges,
    alerts,
    specs,
    pdfReport, // Added
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
