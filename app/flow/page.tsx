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
import { Check, RotateCcw, Image, ChevronDown, Loader2 } from "lucide-react";
import {
  getAllProjects,
  getProjectNodes,
  getProjectEdges,
  updateProjectNode,
  updateProjectEdge,
  createProjectEdge,
  deleteProjectEdge,
} from "@/lib/project/client";
import { edgeColors } from "@/lib/project/constants";
import { getAllComponents } from "@/lib/inventory/client";
import { ItemModel } from "@/lib/inventory/types";
import {
  CustomNode,
  type ComponentNode,
} from "@/features/visual-flow/CustomNode";
import {
  ProjectEdgeModel,
  ProjectModel,
  ProjectNodeModel,
} from "@/lib/project/types";
import { toast } from "sonner";

const nodeTypes = { custom: CustomNode };

export default function FlowScreen() {
  const [selected, setSelected] = useState<ComponentNode | null>(null);
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectModel | null>(
    null,
  );
  const [currentNodes, setCurrentNodes] = useState<ProjectNodeModel[]>([]);
  const [currentEdges, setCurrentEdges] = useState<ProjectEdgeModel[]>([]);
  const [inventory, setInventory] = useState<ItemModel[]>([]);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch initial project and component lists
  useEffect(() => {
    Promise.all([getAllProjects(), getAllComponents()])
      .then(([projs, inv]) => {
        setProjects(projs);
        setInventory(inv);
        if (projs.length > 0) {
          setCurrentProject(projs[0]);
        }
      })
      .catch((err) => console.error("Failed to load initial data:", err));
  }, []);

  // Fetch nodes and edges whenever the active project changes
  useEffect(() => {
    if (!currentProject) return;

    setIsInitialized(false);
    Promise.all([
      getProjectNodes(currentProject.id),
      getProjectEdges(currentProject.id),
    ])
      .then(([nodesData, edgesData]) => {
        setCurrentNodes(nodesData);
        setCurrentEdges(edgesData);
      })
      .catch((err) => console.error("Failed to load project details:", err));
  }, [currentProject]);

  // Map backend models to React Flow properties
  const { nodes: projectNodes, edges: projectEdges } = useMemo(() => {
    const nodes = currentNodes.map((node) => {
      const comp = inventory.find((item) => item.id === node.componentId);
      return {
        id: node.id,
        label: comp?.name || "Unknown",
        type: comp?.category.toLowerCase() || "logic",
        specs: comp?.specs || "",
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
  }, [currentNodes, currentEdges, inventory]);

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
        return createProjectEdge({
          id: uniqueId,
          projectId: currentProject.id,
          sourceId: uiEdge.source,
          targetId: uiEdge.target,
          sourceHandle: (uiEdge.sourceHandle as any) || "bottom",
          targetHandle: (uiEdge.targetHandle as any) || "top",
          label: typeof uiEdge.label === "string" ? uiEdge.label : "",
          type: (uiEdge.type as any) || "logic",
        });
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
                className="flex items-center gap-2 rounded-full"
              >
                {currentProject.name} <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => setCurrentProject(project)}
                  className="focus:bg-primary/20 focus:text-primary transition-colors"
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
              <Image size={48} opacity={0.4} />
            </div>
            <div className="text-xs text-foreground/80 leading-relaxed">
              {selected?.specs}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
