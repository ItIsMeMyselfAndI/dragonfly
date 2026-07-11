"use client";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSessionVersion } from "@/features/auth/store";
import {
  ProjectModel,
  ProjectNodeModel,
  ProjectEdgeModel,
  ProjectComponentModel,
} from "@/lib/apis/project/types";
import { ItemModel } from "@/lib/apis/inventory/types";
import { GeneratedFlow } from "@/lib/apis/generate/types";

interface FlowStore {
  currentProject: ProjectModel | null;
  setCurrentProject: Dispatch<SetStateAction<ProjectModel | null>>;
  currentNodes: ProjectNodeModel[];
  setCurrentNodes: Dispatch<SetStateAction<ProjectNodeModel[]>>;
  currentEdges: ProjectEdgeModel[];
  setCurrentEdges: Dispatch<SetStateAction<ProjectEdgeModel[]>>;
  projectComponents: ProjectComponentModel[];
  setProjectComponents: Dispatch<SetStateAction<ProjectComponentModel[]>>;
  inventory: ItemModel[];
  setInventory: Dispatch<SetStateAction<ItemModel[]>>;
  projects: ProjectModel[];
  setProjects: Dispatch<SetStateAction<ProjectModel[]>>;
  loadDynamicFlow: (
    flowData: GeneratedFlow,
    project?: ProjectModel,
    nodes?: ProjectNodeModel[],
    edges?: ProjectEdgeModel[],
  ) => void;
}

const Ctx = createContext<FlowStore | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProject] = useState<ProjectModel | null>(
    null,
  );
  const [currentNodes, setCurrentNodes] = useState<ProjectNodeModel[]>([]);
  const [currentEdges, setCurrentEdges] = useState<ProjectEdgeModel[]>([]);
  const [projectComponents, setProjectComponents] = useState<
    ProjectComponentModel[]
  >([]);
  const [inventory, setInventory] = useState<ItemModel[]>([]);
  const [projects, setProjects] = useState<ProjectModel[]>([]);

  // When the authenticated identity changes (login / logout / switch account)
  // the cached project list and open project belong to a different requester
  // and must be cleared. The pages re-fetch from the server on the same
  // identity change, so the list is repopulated with the correct scope.
  const sessionVersion = useSessionVersion();
  const prevVersion = useRef(0);
  useEffect(() => {
    if (prevVersion.current !== 0 && prevVersion.current !== sessionVersion) {
      setProjects([]);
      setCurrentProject(null);
    }
    prevVersion.current = sessionVersion;
  }, [sessionVersion, setProjects, setCurrentProject]);

  const loadDynamicFlow = useCallback(
    (
      flowData: GeneratedFlow,
      project?: ProjectModel,
      nodes?: ProjectNodeModel[],
      edges?: ProjectEdgeModel[],
    ) => {
      if (project) {
        setProjects((prev) => {
          if (prev.find((p) => p.id === project.id)) return prev;
          return [...prev, project];
        });
        setCurrentProject(project);
      }

      if (nodes) {
        setCurrentNodes(nodes);
      }

      if (edges) {
        setCurrentEdges(edges);
      }
    },
    [],
  );

  const value = useMemo<FlowStore>(
    () => ({
      currentProject,
      setCurrentProject,
      currentNodes,
      setCurrentNodes,
      currentEdges,
      setCurrentEdges,
      projectComponents,
      setProjectComponents,
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
      projectComponents,
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
