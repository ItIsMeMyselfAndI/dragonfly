"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  getProject,
  getProjectComponents,
} from "@/lib/apis/project/client";
import { getReportsByProjectId } from "@/lib/apis/project/reportClient";
import { GeneratedSpecs } from "@/lib/apis/generate/types";
import { useSessionVersion } from "@/features/auth/store";
import { toast } from "sonner";

interface BomStore {
  components: ProjectComponentModel[];
  originalComponents: ProjectComponentModel[];
  hasUnsavedChanges: boolean;
  alerts: BomAlert[];
  specs: GeneratedSpecs | null;
  pdfReport: Blob | null; // Added
  total: number;
  itemCount: number;
  projectInfo: {
    id?: string;
    name: string;
    tag: ProjectTagEnum;
    isPublic?: boolean;
    isOwner?: boolean;
    authorAlias?: string;
  } | null;
  canEdit: boolean;
  pushedHistory: ProjectCartSummary[];
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  swap: (id: string, next: Omit<ProjectComponentModel, "qty">) => void;
  revertChanges: () => void;
  commitChanges: () => void;
  clearProject: () => void;
  loadProject: (projectName: string) => Promise<void>;
  loadProjectById: (id: string) => Promise<void>;
  loadDynamicProject: (
    projectName: string,
    tag: ProjectTagEnum,
    newComponents: ProjectComponentModel[],
    projectId?: string,
    newAlerts?: BomAlert[],
    newSpecs?: GeneratedSpecs,
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
  const [specs, setSpecs] = useState<GeneratedSpecs | null>(null);
  const [pdfReport, setPdfReport] = useState<Blob | null>(null); // Added
  const [projectInfo, setProjectInfo] = useState<{
    id?: string;
    name: string;
    tag: ProjectTagEnum;
    isPublic?: boolean;
    isOwner?: boolean;
    authorAlias?: string;
  } | null>(null);
  const [pushedHistory, setPushedHistory] = useState<ProjectCartSummary[]>([]);

  const loadProject = async (projectName: string) => {
    const projects = await getAllProjects();
    const project = projects.find((p) => p.name === projectName);
    if (!project) return;

    setProjectInfo({
      id: project.id,
      name: project.name,
      tag: project.tag,
      isPublic: project.isPublic,
      isOwner: project.isOwner,
      authorAlias: project.authorAlias,
    });

    const components = await getProjectComponents(project.id);
    const reports = await getReportsByProjectId(project.id);
    const latestReport = reports.length > 0 ? reports[0] : null;

    setComponents(components);
    setOriginalComponents(components);
    setHasUnsavedChanges(false);
    setAlerts(project.alerts ?? []);
    setSpecs(latestReport?.report_data || null);

    if (latestReport?.pdf_url) {
      const response = await fetch(latestReport.pdf_url);
      const blob = await response.blob();
      setPdfReport(blob);
    } else {
      setPdfReport(null);
    }
  };

  const loadProjectById = useCallback(async (id: string) => {
    const project = await getProject(id);
    if (!project) return;

    setProjectInfo({
      id: project.id,
      name: project.name,
      tag: project.tag,
      isPublic: project.isPublic,
      isOwner: project.isOwner,
      authorAlias: project.authorAlias,
    });

    const components = await getProjectComponents(id);
    const reports = await getReportsByProjectId(id);
    const latestReport = reports.length > 0 ? reports[0] : null;

    setComponents(components);
    setOriginalComponents(components);
    setHasUnsavedChanges(false);
    setAlerts(project.alerts ?? []);
    setSpecs(latestReport?.report_data || null);

    if (latestReport?.pdf_url) {
      const response = await fetch(latestReport.pdf_url);
      const blob = await response.blob();
      setPdfReport(blob);
    } else {
      setPdfReport(null);
    }
  }, []);

  const loadDynamicProject = (
    projectName: string,
    tag: ProjectTagEnum,
    newComponents: ProjectComponentModel[],
    projectId?: string,
    newAlerts: BomAlert[] = [],
    newSpecs: GeneratedSpecs | null = null,
    newPdfReport: Blob | null = null, // Added
  ) => {
    setProjectInfo({ id: projectId, name: projectName, tag });
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

  // The active identity changed (login / logout / switch account). The cached
  // BOM, specs, PDF and history belong to a different person and must be wiped
  // so the next user starts from a clean slate. sessionVersion is the single
  // signal driven by AuthProvider.
  const sessionVersion = useSessionVersion();
  useEffect(() => {
    if (sessionVersion === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    clearProject();
  }, [sessionVersion, clearProject]);

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
      // A viewer of a public project they don't own may look but not edit;
      // they must copy it first. Dynamic/AI projects are always editable.
      canEdit: projectInfo ? projectInfo.isOwner !== false : true,
      pushedHistory,
      setQty: (id, qty) => {
        if (projectInfo && projectInfo.isOwner === false) {
          toast.error("This is a public project. Copy it to make changes.");
          return;
        }
        setComponents((prev) =>
          prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, qty) } : i)),
        );
        setHasUnsavedChanges(true);
      },
      remove: (id) => {
        if (projectInfo && projectInfo.isOwner === false) {
          toast.error("This is a public project. Copy it to make changes.");
          return;
        }
        setComponents((prev) => prev.filter((i) => i.id !== id));
        setHasUnsavedChanges(true);
      },
      swap: (id, next) => {
        if (projectInfo && projectInfo.isOwner === false) {
          toast.error("This is a public project. Copy it to make changes.");
          return;
        }
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
      loadProjectById: async (id) => await loadProjectById(id),
      loadDynamicProject,
      pushToCart,
      moveToLastCart,
    };
  }, [
    clearProject,
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
    loadProjectById,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBom() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useBom outside provider");
  return v;
}
