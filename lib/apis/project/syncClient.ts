import {
  createProject,
  createProjectComponentsBatch,
  createProjectEdgesBatch,
  createProjectNodesBatch,
  createProjectSubstitute,
} from "./client";
import { createItemsBatch } from "../inventory/client";
import { createItemDetailsBatch } from "../inventory/detailsClient";
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
  
  // Sync details for all items in one batch
  const itemsWithDetails = bomResult.items.filter((item) => item.details);
  if (itemsWithDetails.length > 0) {
    await createItemDetailsBatch(itemsWithDetails.map((item) => item.details!));
  }

  const projectComponents = await createProjectComponentsBatch(
    projectId,
    bomResult.components,
  );

  // 4b. Save Substitutes (alternative inventory items, referenced by id)
  if (bomResult.substitutes?.length) {
    for (const sub of bomResult.substitutes) {
      await createProjectSubstitute({
        id: `sub-${sub.originalComponentId}-${sub.substituteComponentId}`,
        projectId,
        originalComponentId: sub.originalComponentId,
        substituteComponentId: sub.substituteComponentId,
      });
    }
  }

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
