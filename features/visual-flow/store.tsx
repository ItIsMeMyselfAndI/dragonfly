"use client";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ProjectModel,
  ProjectNodeModel,
  ProjectEdgeModel,
} from "@/lib/apis/project/types";
import { ItemModel } from "@/lib/apis/inventory/types";

interface FlowStore {
  currentProject: ProjectModel | null;
  setCurrentProject: (project: ProjectModel | null) => void;
  currentNodes: ProjectNodeModel[];
  setCurrentNodes: (nodes: ProjectNodeModel[]) => void;
  currentEdges: ProjectEdgeModel[];
  setCurrentEdges: (edges: ProjectEdgeModel[]) => void;
  inventory: ItemModel[];
  setInventory: (inventory: ItemModel[]) => void;
  projects: ProjectModel[];
  setProjects: Dispatch<SetStateAction<ProjectModel[]>>;
  loadDynamicFlow: (flowData: any) => void;
}

const Ctx = createContext<FlowStore | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProject] = useState<ProjectModel | null>(
    null,
  );
  const [currentNodes, setCurrentNodes] = useState<ProjectNodeModel[]>([]);
  const [currentEdges, setCurrentEdges] = useState<ProjectEdgeModel[]>([]);
  const [inventory, setInventory] = useState<ItemModel[]>([]);
  const [projects, setProjects] = useState<ProjectModel[]>([]);

  const loadDynamicFlow = useCallback((flowData: any) => {
    const project = {
      id: `proj-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: flowData.name,
      time: new Date().toISOString(),
      tag: flowData.tag || "N/A",
    };

    setProjects((prev) => [...prev, project]);
    setCurrentProject(project);

    setCurrentNodes(
      flowData.nodes.map((n: any, i: number) => ({
        id: `node-gen-${Date.now()}-${i}`,
        projectId: project.id,
        componentId: `comp-gen-${i}`,
        positionX: n.positionX,
        positionY: n.positionY,
      })),
    );
    setCurrentEdges(
      flowData.edges.map((e: any, i: number) => ({
        id: `edge-gen-${Date.now()}-${i}`,
        projectId: project.id,
        sourceId: e.sourceId,
        targetId: e.targetId,
        label: e.label,
        type: e.type,
        sourceHandle: e.sourceHandle || "bottom",
        targetHandle: e.targetHandle || "top",
      })),
    );
  }, []);

  const value = useMemo<FlowStore>(
    () => ({
      currentProject,
      setCurrentProject,
      currentNodes,
      setCurrentNodes,
      currentEdges,
      setCurrentEdges,
      inventory,
      setInventory,
      projects,
      setProjects,
      loadDynamicFlow,
    }),
    [
      currentProject,
      currentNodes,
      currentEdges,
      inventory,
      projects,
      loadDynamicFlow,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFlow() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFlow outside provider");
  return v;
}
