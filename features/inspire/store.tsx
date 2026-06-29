"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { generateBOM } from "@/lib/apis/generate/client";
import { generateSpecs } from "@/lib/apis/generate/specsClient";
import { generateVisualFlow } from "@/lib/apis/generate/visualFlowClient";
import { downloadReport } from "@/lib/apis/pdf/client";
import {
  createProject,
  createProjectComponent,
  createProjectEdge,
  createProjectNode,
} from "@/lib/apis/project/client";
import { createItem } from "@/lib/apis/inventory/client";

interface SelectedFile {
  file: File;
  preview: string;
}

interface InspireStore {
  prompt: string;
  setPrompt: (prompt: string) => void;
  selectedFiles: SelectedFile[];
  addFile: (file: File) => void;
  removeFile: (index: number) => void;
  isLoading: boolean;
  loadingText: string;
  generate: (
    router: any,
    loadDynamicProject: (
      projectName: string,
      tag: any,
      newComponents: any[],
      newAlerts?: any[],
      newSpecs?: any,
      newPdfReport?: Blob | null,
    ) => void,
    loadDynamicFlow: (flowData: any) => void,
  ) => Promise<void>;
  setLoadingState: (loading: boolean, text?: string) => void;
}

const Ctx = createContext<InspireStore | null>(null);

export function InspireProvider({ children }: { children: ReactNode }) {
  const [prompt, setPromptState] = useState("");
  const [selectedFiles, setSelectedFilesState] = useState<SelectedFile[]>([]);
  const [isLoading, setIsLoadingState] = useState(false);
  const [loadingText, setLoadingTextState] = useState("Generating...");

  const addFile = useCallback((file: File) => {
    const preview = URL.createObjectURL(file);
    setSelectedFilesState((prev) => [...prev, { file, preview }]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFilesState((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  }, []);

  const setLoadingState = useCallback((loading: boolean, text?: string) => {
    setIsLoadingState(loading);
    if (text) setLoadingTextState(text);
  }, []);

  const generate = useCallback(
    async (router: any, loadDynamicProject: any, loadDynamicFlow: any) => {
      if (prompt.trim() === "" && selectedFiles.length === 0) {
        throw new Error("Prompt and files are empty");
      }

      setIsLoadingState(true);
      try {
        const imageFile =
          selectedFiles.length > 0 ? selectedFiles[0].file : null;
        const sanitizedPrompt = prompt
          ? prompt.replace(/[^\x00-\x7F]/g, "")
          : null;

        setLoadingTextState("Calculating specs...");
        const specsData = await generateSpecs(sanitizedPrompt, imageFile);
        const specsContext = JSON.stringify(specsData);

        const pdfBytes = (await downloadReport(
          {
            projectName: sanitizedPrompt || "Extracted Schematic",
            items: specsData.specs,
          },
          true,
        )) as ArrayBuffer;

        setLoadingTextState("Generating visual flow...");
        const flowResult = await generateVisualFlow(
          specsContext,
          sanitizedPrompt,
          imageFile,
        );
        if (flowResult) {
          loadDynamicFlow(flowResult);
        }

        // 1 second delay for visual polish
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setLoadingTextState("Generating BOM...");
        const combinedPrompt = sanitizedPrompt
          ? `${sanitizedPrompt}\n\nRELEVANT SPECS ANALYSIS:\n${specsContext}`
          : `Generate a BOM based on the following specs analysis:\n${specsContext}`;
        const bomResult = await generateBOM(combinedPrompt, imageFile);

        const projectName = sanitizedPrompt
          ? sanitizedPrompt
          : "Extracted Schematic";

        loadDynamicProject(
          projectName,
          bomResult.tag || "N/A",
          bomResult.items,
          bomResult.alerts,
          specsData,
          new Blob([pdfBytes], { type: "application/pdf" }),
        );

        // --- SYNC TO DB START ---
        try {
          // 1. Create the Project
          const project = await createProject({
            id: `proj-gen-${Date.now()}`,
            name: projectName,
            time: new Date().toISOString(),
            tag: bomResult.tag || "N/A",
          });

          // 2. Save Inventory Items & Link to Project Components
          const componentIdMap: Record<string, string> = {};
          await Promise.all(
            bomResult.items.map(async (item: any, idx: number) => {
              // Map AI category to valid ItemCategory enum
              const categoryMap: Record<string, any> = {
                "MCU": "MCU",
                "Sensor": "Sensor",
                "Actuator": "Actuator",
                "Logic": "Logic",
                "Power": "Power",
                "Passive": "Passive",
                "IoT": "MCU",
                "Robotics": "Actuator",
                "Networking": "Logic",
                "Mechatronics": "Actuator",
              };
              const validCategory = categoryMap[item.category] || "Logic";

              // Ensure item is in the global inventory
              const newItem = await createItem({
                id: `item-gen-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
                name: item.name,
                partNumber: item.partNumber,
                category: validCategory,
                specs: item.specs,
                manufacturer: item.manufacturer,
                unitPrice: item.unitPrice,
                stock: item.stock,
                qty: 0,
                stockCount: 0,
                pins: [],
              });

              // Link this item to the project
              const projectComp = await createProjectComponent(project.id, {
                id: `comp-proj-gen-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
                inventoryId: newItem.id,
                qty: item.qty || 1,
                name: item.name,
                partNumber: item.partNumber,
                category: validCategory,
                specs: item.specs,
                unitPrice: item.unitPrice,
                stock: item.stock,
                stockCount: 0,
                pins: [],
              });

              // Map the AI component name to the database ProjectComponent ID
              if (item.name) {
                componentIdMap[item.name] = projectComp.id;
              }
            })
          );

          // 3. Save Visual Flow Nodes
          if (flowResult && flowResult.nodes) {
            await Promise.all(
              flowResult.nodes.map(async (node: any) => {
                // The node.id in flowResult is the component name (per server instruction)
                const compId = componentIdMap[node.id];
                
                if (!compId) {
                  console.warn(`Could not find ProjectComponent ID for node: ${node.id}`);
                  return; // Skip nodes that don't have a corresponding component
                }

                return createProjectNode({
                  id: `node-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  projectId: project.id,
                  componentId: compId,
                  positionX: node.positionX,
                  positionY: node.positionY,
                });
              }),
            );
          }

          // 4. Save Visual Flow Edges
          if (flowResult && flowResult.edges) {
            await Promise.all(
              flowResult.edges.map((edge: any) =>
                createProjectEdge({
                  id: `edge-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  projectId: project.id,
                  sourceId: edge.sourceId,
                  targetId: edge.targetId,
                  label: edge.label,
                  type: edge.type,
                }),
              ),
            );
          }
        } catch (syncError) {
          console.error("Background sync to DB failed:", syncError);
        }
        // --- SYNC TO DB END ---

        router.push(
          `/bom?generate=dynamic&prompt=${encodeURIComponent(projectName)}`,
        );
      } catch (e) {
        console.error(e);
        throw e;
      } finally {
        setIsLoadingState(false);
        setLoadingTextState("Generating...");
      }
    },
    [prompt, selectedFiles],
  );

  const value = useMemo<InspireStore>(
    () => ({
      prompt,
      setPrompt: setPromptState,
      selectedFiles,
      addFile,
      removeFile,
      isLoading,
      loadingText,
      setLoadingState,
      generate,
    }),
    [
      prompt,
      selectedFiles,
      isLoading,
      loadingText,
      addFile,
      removeFile,
      setLoadingState,
      generate,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInspire() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useInspire outside provider");
  return v;
}
