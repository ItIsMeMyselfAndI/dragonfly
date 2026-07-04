import {
  createProject,
  createProjectComponentsBatch,
  createProjectEdgesBatch,
  createProjectNodesBatch,
} from "./client";
import { createItemsBatch } from "../inventory/client";
import { createItemDetails, createItemDetailsBatch } from "../inventory/detailsClient";
import { uploadToStorage } from "../storage/client";
import { createReport } from "./reportClient";
import { GeneratedSpecs, GeneratedFlow, GeneratedBOM } from "../generate/types";
import {
  ProjectComponentModel,
  ProjectTagEnum,
  ProjectModel,
  ProjectNodeModel,
  ProjectEdgeModel,
} from "./types";
import { ItemModel } from "../inventory/types";

export async function syncGeneratedData(
  projectName: string,
  specsData: GeneratedSpecs,
  bomResult: GeneratedBOM,
  flowResult: GeneratedFlow,
  pdfBytes: ArrayBuffer,
): Promise<{
  project: ProjectModel;
  projectTag: ProjectTagEnum;
  projectComponents: ProjectComponentModel[];
  nodes: ProjectNodeModel[];
  edges: ProjectEdgeModel[];
}> {
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

  // 2. Upload PDF to Storage (only once)
  const pdfFile = new File([new Blob([pdfBytes])], `${projectName}.pdf`, {
    type: "application/pdf",
  });
  const uploadResult = await uploadToStorage(
    pdfFile,
    `reports/${projectName}-${Date.now()}.pdf`,
  );
  const pdfUrl = uploadResult.url;

  // 3. Create Report
  await createReport({
    project_id: projectId,
    report_name: `${projectName} Report`,
    report_data: specsData as any,
    pdf_url: pdfUrl,
  });

  // 4. Save Inventory Items & Link to Project Components
  await createItemsBatch(bomResult.items);
  
  // Sync details for all items, individually to pinpoint failures
  const itemsWithDetails = bomResult.items.filter((item) => item.details);
  if (itemsWithDetails.length > 0) {
    for (const item of itemsWithDetails) {
        try {
            await createItemDetails(item.details);
        } catch (error) {
            console.error(`Failed to sync details for inventory ID ${item.details.inventoryId}:`, error);
            // Optionally: throw new Error(`Foreign Key Violation: Inventory ID ${item.details.inventoryId} does not exist.`);
        }
    }
  }

  const projectComponents = await createProjectComponentsBatch(
    projectId,
    bomResult.components,
  );

  // 5. Save Visual Flow Nodes
  const nodes = flowResult.nodes
    ? await createProjectNodesBatch(projectId, flowResult.nodes)
    : [];

  // 6. Save Visual Flow Edges
  const edges = flowResult.edges
    ? await createProjectEdgesBatch(projectId, flowResult.edges)
    : [];

  return { project, projectTag, projectComponents, nodes, edges };
}
