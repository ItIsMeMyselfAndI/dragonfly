"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Check,
  RotateCcw,
  ChevronDown,
  Loader2,
  ImageIcon,
} from "lucide-react";
import {
  getAllProjects,
  getProjectNodes,
  getProjectEdges,
  updateProjectNode,
  updateProjectEdge,
  createProjectEdge,
  deleteProjectEdge,
  getProjectComponents,
} from "@/lib/apis/project/client";
import { edgeColors } from "@/lib/apis/project/constants";
import { getAllItems } from "@/lib/apis/inventory/client";
import {
  CustomNode,
  type ComponentNode,
} from "@/features/visual-flow/CustomNode";
import { toast } from "sonner";
import { useFlow } from "@/features/visual-flow/store";
import { ProjectModel } from "@/lib/apis/project/types";

const nodeTypes = { custom: CustomNode };

export default function FlowScreen() {
  const {
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
  } = useFlow();

  const [selected, setSelected] = useState<ComponentNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch initial project and component lists
  useEffect(() => {
    Promise.all([getAllProjects(), getAllItems()])
      .then(([projs, inv]) => {
        setProjects((prev: ProjectModel[]) => {
          const newProjects: ProjectModel[] = [
            ...projs,
            ...prev.filter(
              (p: ProjectModel) =>
                !projs.find((bp: ProjectModel) => bp.id === p.id),
            ),
          ];
          return newProjects;
        });
        setInventory(inv);
        if (projs.length > 0 && !currentProject) {
          setCurrentProject(projs[0]);
        }
      })
      .catch((err) => console.error("Failed to load initial data:", err));
  }, [setProjects, setInventory, setCurrentProject]); // Removed currentProject from deps to prevent reset loop

  // Fetch nodes, edges and components whenever the active project changes
  useEffect(() => {
    if (!currentProject) return;

    setIsInitialized(false);
    Promise.all([
      getProjectNodes(currentProject.id),
      getProjectEdges(currentProject.id),
      getProjectComponents(currentProject.id),
    ])
      .then(([nodesData, edgesData, componentsData]) => {
        setCurrentNodes(nodesData);
        setCurrentEdges(edgesData);
        setProjectComponents(componentsData);
      })
      .catch((err) => console.error("Failed to load project details:", err));
  }, [currentProject, setCurrentNodes, setCurrentEdges, setProjectComponents]);

  // Map backend models to React Flow properties
  const { nodes: projectNodes, edges: projectEdges } = useMemo(() => {
    const nodes = currentNodes.map((node) => {
      const projComp = projectComponents.find(
        (pc) => pc.id === node.componentId,
      );
      const comp = projComp
        ? inventory.find((item) => item.id === projComp.inventoryId)
        : null;

      return {
        id: node.id,
        label: comp?.name || projComp?.name || "Unknown Component",
        type:
          comp?.category?.toLowerCase() ||
          projComp?.category?.toLowerCase() ||
          "logic",
        shortDesc:
          comp?.shortDesc ||
          projComp?.shortDesc ||
          "No specifications available",
        position: { x: node.positionX, y: node.positionY },
      };
    });

    const edges = currentEdges.map((edge) => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      sourceHandle: edge.sourceHandle || "bottom",
      targetHandle: edge.targetHandle || "top",
      label: edge.label ?? "",
      type: edge.type ?? "logic",
    }));

    return { nodes, edges };
  }, [currentNodes, currentEdges, inventory, projectComponents]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Initialize canvas when data is loaded from the backend
  useEffect(() => {
    if (projectNodes.length === 0 && currentNodes.length > 0) return;

    setNodes(
      projectNodes.map((node) => ({
        id: node.id,
        type: "custom",
        data: { component: node, onClick: setSelected },
        position: node.position,
      })),
    );
    setEdges(
      projectEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
        animated: true,
        type: "smoothstep",
        style: {
          stroke: edgeColors[edge.type as keyof typeof edgeColors] || "#a1a1aa",
          strokeWidth: 2,
        },
        labelBgStyle: { fill: "transparent" },
        labelStyle: { fill: "#a1a1aa", fontSize: 10, fontWeight: 500 },
      })),
    );
    setIsInitialized(true);
  }, [
    projectNodes,
    projectEdges,
    setNodes,
    setEdges,
    setSelected,
    currentNodes.length,
  ]);

  // Handle user drawing new connection lines between handles
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: `reactflow__edge-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            animated: true,
            type: "smoothstep",
            style: {
              stroke: "#a1a1aa",
              strokeWidth: 2,
            },
            labelBgStyle: { fill: "transparent" },
            labelStyle: { fill: "#a1a1aa", fontSize: 10, fontWeight: 500 },
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  // Revert changes back to original database state
  const handleDiscard = useCallback(() => {
    setNodes(
      projectNodes.map((node) => ({
        id: node.id,
        type: "custom",
        data: { component: node, onClick: setSelected },
        position: node.position,
      })),
    );
    setEdges(
      projectEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
        animated: true,
        type: "smoothstep",
        style: {
          stroke: edgeColors[edge.type as keyof typeof edgeColors] || "#a1a1aa",
          strokeWidth: 2,
        },
        labelBgStyle: { fill: "transparent" },
        labelStyle: { fill: "#a1a1aa", fontSize: 10, fontWeight: 500 },
      })),
    );
    toast.success("Workspace layout changes reverted");
  }, [projectNodes, projectEdges, setNodes, setEdges, setSelected]);

  // Save changes to backend database files
  const handleSave = useCallback(async () => {
    if (!currentProject) return;

    try {
      setIsSaving(true);

      // 1. Identify node position changes
      const nodeUpdatePromises = nodes
        .filter((uiNode) => {
          const original = currentNodes.find((n) => n.id === uiNode.id);
          if (!original) return false;
          // Using a small tolerance check or round to prevent minor coordinate floating errors
          return (
            Math.round(uiNode.position.x) !== Math.round(original.positionX) ||
            Math.round(uiNode.position.y) !== Math.round(original.positionY)
          );
        })
        .map((uiNode) =>
          updateProjectNode(uiNode.id, {
            positionX: Math.round(uiNode.position.x),
            positionY: Math.round(uiNode.position.y),
          }),
        );

      // 2. Identify edge removals
      const deletedEdges = currentEdges.filter(
        (original) => !edges.some((uiEdge) => uiEdge.id === original.id),
      );
      const edgeDeletePromises = deletedEdges.map((e) =>
        deleteProjectEdge(e.id),
      );

      // 3. Identify edge additions
      const newEdges = edges.filter(
        (uiEdge) => !currentEdges.some((original) => original.id === uiEdge.id),
      );
      const edgeCreatePromises = newEdges.map((uiEdge, idx) => {
        const uniqueId = `edge_${Date.now()}_${Math.random().toString(36).substr(2, 5)}_${idx}`;
        return createProjectEdge(
          {
            id: uniqueId,
            sourceId: uiEdge.source,
            targetId: uiEdge.target,
            label: typeof uiEdge.label === "string" ? uiEdge.label : "",
            type: (uiEdge.type as any) || "logic",
          },
          currentProject.id,
        );
      });

      // 4. Identify edge updates (e.g. if handles are re-routed on same edge ID)
      const updatedEdges = edges.filter((uiEdge) => {
        const original = currentEdges.find((e) => e.id === uiEdge.id);
        if (!original) return false;
        return (
          original.sourceId !== uiEdge.source ||
          original.targetId !== uiEdge.target ||
          (original.sourceHandle || "bottom") !==
            (uiEdge.sourceHandle || "bottom") ||
          (original.targetHandle || "top") !== (uiEdge.targetHandle || "top")
        );
      });
      const edgeUpdatePromises = updatedEdges.map((uiEdge) =>
        updateProjectEdge(uiEdge.id, {
          sourceId: uiEdge.source,
          targetId: uiEdge.target,
          sourceHandle: (uiEdge.sourceHandle as any) || "bottom",
          targetHandle: (uiEdge.targetHandle as any) || "top",
        }),
      );

      // Save everything concurrently
      await Promise.all([
        ...nodeUpdatePromises,
        ...edgeDeletePromises,
        ...edgeCreatePromises,
        ...edgeUpdatePromises,
      ]);

      toast.success("Workspace layout saved successfully");

      // Reload project state to align client and backend representations
      const [refreshedNodes, refreshedEdges] = await Promise.all([
        getProjectNodes(currentProject.id),
        getProjectEdges(currentProject.id),
      ]);
      setCurrentNodes(refreshedNodes);
      setCurrentEdges(refreshedEdges);
    } catch (err) {
      console.error("Failed to save flow state:", err);
      toast.error("Failed to save workspace layout changes");
    } finally {
      setIsSaving(false);
    }
  }, [currentProject, nodes, edges, currentNodes, currentEdges]);

  // Compute if the local state has any differences with the backend data
  const hasChanges = useMemo(() => {
    if (!isInitialized) return false;

    // A. Check for node changes
    const nodeChanged =
      nodes.length !== currentNodes.length ||
      currentNodes.some((n) => {
        const uiNode = nodes.find((un) => un.id === n.id);
        if (!uiNode) return true;
        return (
          Math.round(uiNode.position.x) !== Math.round(n.positionX) ||
          Math.round(uiNode.position.y) !== Math.round(n.positionY)
        );
      });

    // B. Check for edge changes
    const edgeChanged =
      edges.length !== currentEdges.length ||
      edges.some((uiEdge) => {
        return !currentEdges.some(
          (e) =>
            e.id === uiEdge.id &&
            e.sourceId === uiEdge.source &&
            e.targetId === uiEdge.target &&
            (e.sourceHandle || "bottom") ===
              (uiEdge.sourceHandle || "bottom") &&
            (e.targetHandle || "top") === (uiEdge.targetHandle || "top"),
        );
      });

    return nodeChanged || edgeChanged;
  }, [isInitialized, nodes, edges, currentNodes, currentEdges]);

  if (!currentProject) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="px-5 pt-14 pb-4">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Visual flow
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {currentProject.name}
            </h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 rounded-full max-w-[200px]"
              >
                <span className="truncate">{currentProject.name}</span>{" "}
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-w-[250px]">
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => setCurrentProject(project)}
                  className="focus:bg-primary/20 focus:text-primary transition-colors truncate"
                >
                  {project.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
      </div>

      <div className="flex-1 rounded-3xl border border-white/5 bg-surface/40 m-5 mb-28 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#333" gap={20} />
          <Controls />
        </ReactFlow>

        {/* Floating Save / Discard Controls Panel */}
        {hasChanges && (
          <div className="absolute top-6 right-6 z-50 flex items-center gap-1.5 rounded-full border border-white/5 bg-surface-elevated/80 p-1.5 shadow-2xl backdrop-blur-lg animate-in fade-in zoom-in-95 duration-200">
            <Button
              variant="ghost"
              size="icon"
              disabled={isSaving}
              onClick={handleDiscard}
              className="h-9 w-9 rounded-full text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-all duration-200 active:scale-95 cursor-pointer"
              title="Discard changes"
            >
              <RotateCcw size={16} />
            </Button>
            <div className="h-4 w-px bg-white/10" />
            <Button
              variant="ghost"
              size="icon"
              disabled={isSaving}
              onClick={handleSave}
              className="h-9 w-9 rounded-full bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary-foreground transition-all duration-200 active:scale-95 cursor-pointer shadow-md shadow-primary/5"
              title="Save changes"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin text-primary" />
              ) : (
                <Check size={16} />
              )}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-surface border-white/10">
          <DialogHeader>
            <DialogTitle>{selected?.label}</DialogTitle>
            <DialogDescription>
              {selected?.type.toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="h-40 w-full rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
              <ImageIcon size={48} opacity={0.4} />
            </div>
            <div className="text-xs text-foreground/80 leading-relaxed">
              {selected?.shortDesc}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
