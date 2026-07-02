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
import { generateSpecs } from "@/lib/apis/generate/specsClient";
import { generateBOM } from "@/lib/apis/generate/bomClient";
import { generateVisualFlow } from "@/lib/apis/generate/visualFlowClient";
import { withRetry } from "@/lib/apis/generate/utils";
import { downloadReport } from "@/lib/apis/pdf/client";
import { createReport } from "@/lib/apis/project/reportClient";
import {
  createProject,
  createProjectComponent,
  createProjectEdge,
  createProjectNode,
} from "@/lib/apis/project/client";
import { createItem } from "@/lib/apis/inventory/client";
import { uploadToStorage } from "@/lib/apis/storage/client";
import {
  GeneratedBOMItem,
  GeneratedSpecs,
  GeneratedFlow,
} from "@/lib/apis/generate/types";
import {
  ProjectComponentModel,
  ProjectEdge,
  ProjectEdgeModel,
  ProjectNode,
  ProjectNodeModel,
  ProjectTagEnum,
} from "@/lib/apis/project/types";
import { ItemCategory } from "@/lib/apis/inventory/types";
import { BomAlert } from "@/features/bom/data";

interface SelectedFile {
  file: File;
  preview: string;
}

interface InspireStore {
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;
  selectedFiles: SelectedFile[];
  addFile: (file: File) => void;
  removeFile: (index: number) => void;
  isLoading: boolean;
  loadingText: string;
  generate: (
    router: any,
    loadDynamicProject: (
      projectName: string,
      tag: ProjectTagEnum,
      newComponents: ProjectComponentModel[],
      newAlerts?: BomAlert[],
      newSpecs?: GeneratedSpecs,
      newPdfReport?: Blob | null,
    ) => void,
    loadDynamicFlow: (flowData: GeneratedFlow) => void,
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
    async (
      router: any,
      loadDynamicProject: (
        projectName: string,
        tag: ProjectTagEnum,
        newComponents: ProjectComponentModel[],
        newAlerts?: BomAlert[],
        newSpecs?: GeneratedSpecs,
        newPdfReport?: Blob | null,
      ) => void,
      loadDynamicFlow: (flowData: GeneratedFlow) => void,
    ) => {
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

        // 1. Specs
        setLoadingTextState("Calculating specs...");
        const generationTimestamp = new Date().toISOString();
        const specsData = await withRetry(async () => {
          return await generateSpecs(sanitizedPrompt, imageFile);
        });
        const specsContext = JSON.stringify(specsData);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 2. BOM
        setLoadingTextState("Generating BOM...");
        const bomResult = await withRetry(async () => {
          return await generateBOM(
            specsContext,
            imageFile,
            generationTimestamp,
          );
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 3. Flow
        setLoadingTextState("Generating visual flow...");
        const flowResult = await withRetry(async () => {
          return await generateVisualFlow(
            JSON.stringify(bomResult),
            sanitizedPrompt,
            imageFile,
          );
        });

        const projectName = flowResult.name || "Generated Project";

        setLoadingTextState("Generating report...");
        const pdfBytes = (await downloadReport(
          {
            projectName,
            items: specsData.specs,
          },
          true,
        )) as ArrayBuffer;

        // --- SYNC TO DB START ---
        try {
          // Convert tag from string to ProjectTagEnum
          const tagMap: Record<string, ProjectTagEnum> = {
            Robotics: ProjectTagEnum.ROBOTICS,
            IoT: ProjectTagEnum.IOT,
            Power: ProjectTagEnum.POWER,
            Networking: ProjectTagEnum.NETWORKING,
            Mechatronics: ProjectTagEnum.MECHATRONICS,
            "N/A": ProjectTagEnum.NA,
          };
          const projectTag = tagMap[bomResult.tag] || ProjectTagEnum.NA;

          // 1. Create the Project
          const projectId = `proj-gen-${Date.now()}`;
          const project = await createProject({
            id: projectId,
            name: projectName,
            time: new Date().toISOString(),
            tag: projectTag,
          });

          // Upload PDF and Create Report
          const pdfFile = new File(
            [new Blob([pdfBytes])],
            `${projectName}.pdf`,
            { type: "application/pdf" },
          );
          const uploadResult = await uploadToStorage(
            pdfFile,
            `reports/${projectName}-${Date.now()}.pdf`,
          );
          const pdfUrl = uploadResult.url;

          await createReport({
            project_id: projectId,
            report_name: `${projectName} Report`,
            report_data: specsData,
            pdf_url: pdfUrl,
          });

          // 2. Save Inventory Items & Link to Project Components
          const componentIdMap: Record<string, string> = {};
          const projectComponents: ProjectComponentModel[] = [];

          await Promise.all(
            bomResult.items.map(async (item: GeneratedBOMItem, idx: number) => {
              // Map AI category to valid ItemCategory enum
              const categoryMap: Record<string, ItemCategory> = {
                MCU: ItemCategory.MCU,
                Sensor: ItemCategory.Sensor,
                Actuator: ItemCategory.Actuator,
                Logic: ItemCategory.Logic,
                Power: ItemCategory.Power,
                Passive: ItemCategory.Passive,
                IoT: ItemCategory.MCU,
                Robotics: ItemCategory.Actuator,
                Networking: ItemCategory.Logic,
                Mechatronics: ItemCategory.Actuator,
              };
              const validCategory =
                categoryMap[item.category] || ItemCategory.Logic;

              // Item already created in generateBomLogic, but ensure it's consistent
              const newItem = await createItem({
                id: item.id,
                name: item.name,
                partNumber: item.partNumber,
                category: validCategory,
                specs: item.specs || "",
                details: item.details,
                unitPrice: item.unitPrice,
                stock: item.stock,
                stockCount: item.stockCount,
                pins: item.pins || [],
              });

              // Link this item to the project
              const projectComp = await createProjectComponent(project.id, {
                id: `comp-proj-gen-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
                inventoryId: newItem.id,
                qty: 1,
                name: item.name,
                partNumber: item.partNumber,
                category: validCategory,
                specs: item.specs || "",
                unitPrice: item.unitPrice,
                stock: item.stock,
                stockCount: item.stockCount,
                pins: item.pins || [],
              });

              projectComponents.push(projectComp);

              // Map the AI component name to the database ProjectComponent ID
              if (item.name) {
                componentIdMap[item.name] = projectComp.id;
              }
            }),
          );

          // Load the dynamic project with the created components
          loadDynamicProject(
            projectName,
            projectTag,
            projectComponents,
            bomResult.alerts,
            specsData,
            new Blob([pdfBytes], { type: "application/pdf" }),
          );

          // 3. Save Visual Flow Nodes
          const nodeDbIds: Record<string, string> = {};
          const createdNodes: ProjectNodeModel[] = [];
          if (flowResult && flowResult.nodes) {
            await Promise.all(
              flowResult.nodes.map(async (node: ProjectNode) => {
                const compId = componentIdMap[node.id];

                if (!compId) {
                  console.warn(
                    `Could not find ProjectComponent ID for node: ${node.id}`,
                  );
                  return;
                }

                const nodeId = `node-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                nodeDbIds[node.id] = nodeId;

                const createdNode = await createProjectNode({
                  id: nodeId,
                  projectId: project.id,
                  componentId: compId,
                  positionX: node.positionX,
                  positionY: node.positionY,
                });
                createdNodes.push(createdNode);
              }),
            );
          }

          // 4. Save Visual Flow Edges
          const createdEdges: ProjectEdgeModel[] = [];
          if (flowResult && flowResult.edges) {
            await Promise.all(
              flowResult.edges.map(async (edge: ProjectEdge) => {
                const sourceId = nodeDbIds[edge.sourceId];
                const targetId = nodeDbIds[edge.targetId];

                if (!sourceId || !targetId) {
                  console.warn(
                    `Could not find DB node IDs for edge: ${edge.sourceId} -> ${edge.targetId}`,
                  );
                  return;
                }

                const createdEdge = await createProjectEdge({
                  id: `edge-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  projectId: project.id,
                  sourceId: sourceId,
                  targetId: targetId,
                  label: edge.label,
                  type: edge.type,
                });
                createdEdges.push(createdEdge);
              }),
            );
          }

          // Synchronize store with real DB data to prevent disappearing nodes and dummy data
          if (flowResult) {
            loadDynamicFlow(
              flowResult,
              // project,
              // createdNodes,
              // createdEdges,
              // projectComponents,
            );
          }

          // 5. Upload Specs PDF to Storage
          try {
            const pdfFile = new File([pdfBytes], `${projectName}-specs.pdf`, {
              type: "application/pdf",
            });
            const storagePath = `specs/${project.id}/${pdfFile.name}`;
            await uploadToStorage(pdfFile, storagePath);
          } catch (pdfError) {
            console.error("PDF upload failed:", pdfError);
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
