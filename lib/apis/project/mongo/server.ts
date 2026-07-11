import { connectToDatabase } from "@/lib/mongodb/connection";
import { ProjectModel, type ProjectDocument } from "@/lib/mongodb/models/project";
import {
  InventoryModel,
  type InventoryPlain,
} from "@/lib/mongodb/models/inventory";
import {
  StockStatus,
  ItemCategory,
  ItemDetails,
} from "@/lib/apis/inventory/types";
import {
  ProjectModel as ProjectMeta,
  ProjectNodeModel,
  ProjectEdgeModel,
  ProjectSubstituteModel,
  ProjectComponentModel,
  ProjectSpecsReportModel,
  ComponentNodeType,
  ComponentEdgeType,
} from "../types";

// --- Helpers ---

type ProjectMetaShape = ProjectMeta;

async function findProjectIdBySubdoc(
  field: "nodes" | "edges" | "components" | "substitutes" | "specsReport",
  subId: string,
): Promise<string | null> {
  const filter =
    field === "specsReport" ? { "specsReport.id": subId } : { [`${field}.id`]: subId };
  const doc = await ProjectModel.findOne(filter)
    .lean<ProjectDocument>()
    .select({ _id: 1 });
  return doc ? doc._id : null;
}

async function getJoinedComponents(
  projectId: string,
): Promise<ProjectComponentModel[]> {
  const project = await ProjectModel.findById(projectId).lean<ProjectDocument>();
  if (!project) return [];

  const inventoryIds = project.components
    .map((c) => c.inventoryId)
    .filter((id): id is string => Boolean(id));

  const items = inventoryIds.length
    ? await InventoryModel.find({ _id: { $in: inventoryIds } }).lean<InventoryPlain[]>()
    : [];
  const itemMap = new Map(items.map((i) => [i._id, i]));

  return project.components.map((c) => {
    const inv = c.inventoryId ? itemMap.get(c.inventoryId) : undefined;
    return {
      id: c.id,
      projectId,
      inventoryId: c.inventoryId,
      qty: c.qty,
      name: inv?.name ?? "",
      partNumber: inv?.partNumber ?? "",
      shortDesc: inv?.shortDesc ?? "",
      unitPrice: inv?.unitPrice ?? 0,
      stock: inv?.stock ?? StockStatus.OUT,
      stockCount: inv?.stockCount ?? 0,
      category: inv?.category ?? ("" as ItemCategory),
      pins: inv?.pins ?? [],
      details: (inv?.details ?? {}) as ItemDetails,
      createdAt: c.createdAt ?? undefined,
      updatedAt: c.updatedAt ?? undefined,
    } satisfies ProjectComponentModel;
  });
}

// --- Projects ---

export async function getAllProjects(): Promise<ProjectMetaShape[]> {
  await connectToDatabase();
  const docs = await ProjectModel.find({})
    .sort({ time: -1 })
    .lean<ProjectDocument[]>();
  return docs.map((d) => ({ id: d._id, name: d.name, time: d.time, tag: d.tag }));
}

export async function getProjectById(
  id: string,
): Promise<ProjectMetaShape | undefined> {
  await connectToDatabase();
  const doc = await ProjectModel.findById(id).lean<ProjectDocument>();
  if (!doc) return undefined;
  return { id: doc._id, name: doc.name, time: doc.time, tag: doc.tag };
}

export async function createProject(
  project: ProjectMetaShape,
): Promise<ProjectMetaShape> {
  await connectToDatabase();
  await ProjectModel.create({
    _id: project.id,
    name: project.name,
    time: project.time,
    tag: project.tag,
    components: [],
    nodes: [],
    edges: [],
    substitutes: [],
    specsReport: null,
  });
  return { id: project.id, name: project.name, time: project.time, tag: project.tag };
}

export async function updateProject(
  id: string,
  updated: Partial<ProjectMetaShape>,
): Promise<ProjectMetaShape | undefined> {
  await connectToDatabase();
  const set: Record<string, unknown> = {};
  if ("name" in updated) set.name = updated.name;
  if ("time" in updated) set.time = updated.time;
  if ("tag" in updated) set.tag = updated.tag;

  const doc = await ProjectModel.findByIdAndUpdate(id, { $set: set }, { new: true }).lean<ProjectDocument>();
  if (!doc) return undefined;
  return { id: doc._id, name: doc.name, time: doc.time, tag: doc.tag };
}

export async function deleteProject(id: string): Promise<boolean> {
  await connectToDatabase();
  const result = await ProjectModel.deleteOne({ _id: id });
  return result.deletedCount === 1;
}

// --- Nodes ---

export async function createNodesBatch(
  nodes: ProjectNodeModel[],
): Promise<ProjectNodeModel[]> {
  await connectToDatabase();
  if (nodes.length === 0) return [];
  const projectId = nodes[0].projectId;
  const mapped = nodes.map((n) => ({
    id: n.id,
    componentId: n.componentId,
    positionX: n.positionX,
    positionY: n.positionY,
  }));
  await ProjectModel.updateOne(
    { _id: projectId },
    { $push: { nodes: { $each: mapped } } },
  );
  return nodes;
}

export async function getNodesByProjectId(
  projectId: string,
): Promise<ProjectNodeModel[]> {
  await connectToDatabase();
  const doc = await ProjectModel.findById(projectId).lean<ProjectDocument>();
  if (!doc) return [];
  return doc.nodes.map((n) => ({
    id: n.id,
    projectId,
    componentId: n.componentId,
    positionX: n.positionX,
    positionY: n.positionY,
  }));
}

export async function createNode(
  node: ComponentNodeType,
  projectId: string,
): Promise<ProjectNodeModel> {
  await connectToDatabase();
  const created: ProjectNodeModel = {
    id: node.id,
    projectId,
    componentId: node.componentId,
    positionX: node.positionX,
    positionY: node.positionY,
  };
  await ProjectModel.updateOne(
    { _id: projectId },
    { $push: { nodes: { id: node.id, componentId: node.componentId, positionX: node.positionX, positionY: node.positionY } } },
  );
  return created;
}

export async function updateNode(
  id: string,
  updated: Partial<ProjectNodeModel>,
): Promise<ProjectNodeModel | undefined> {
  await connectToDatabase();
  const projectId = await findProjectIdBySubdoc("nodes", id);
  if (!projectId) return undefined;

  const set: Record<string, unknown> = {};
  if ("componentId" in updated) set["nodes.$[node].componentId"] = updated.componentId;
  if ("positionX" in updated) set["nodes.$[node].positionX"] = updated.positionX;
  if ("positionY" in updated) set["nodes.$[node].positionY"] = updated.positionY;

  await ProjectModel.updateOne(
    { _id: projectId },
    { $set: set },
    { arrayFilters: [{ "node.id": id }] },
  );

  const doc = await ProjectModel.findById(projectId).lean<ProjectDocument>();
  const node = doc?.nodes.find((n) => n.id === id);
  return node
    ? { id: node.id, projectId, componentId: node.componentId, positionX: node.positionX, positionY: node.positionY }
    : undefined;
}

export async function deleteNode(id: string): Promise<boolean> {
  await connectToDatabase();
  const projectId = await findProjectIdBySubdoc("nodes", id);
  if (!projectId) return false;
  const result = await ProjectModel.updateOne(
    { _id: projectId },
    { $pull: { nodes: { id } } },
  );
  return result.modifiedCount === 1;
}

// --- Edges ---

export async function createEdgesBatch(
  edges: ProjectEdgeModel[],
): Promise<ProjectEdgeModel[]> {
  await connectToDatabase();
  if (edges.length === 0) return [];
  const projectId = edges[0].projectId;
  const mapped = edges.map((e) => ({
    id: e.id,
    sourceId: e.sourceId,
    targetId: e.targetId,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    label: e.label,
    type: e.type,
  }));
  await ProjectModel.updateOne(
    { _id: projectId },
    { $push: { edges: { $each: mapped } } },
  );
  return edges;
}

export async function getEdgesByProjectId(
  projectId: string,
): Promise<ProjectEdgeModel[]> {
  await connectToDatabase();
  const doc = await ProjectModel.findById(projectId).lean<ProjectDocument>();
  if (!doc) return [];
  return doc.edges.map((e) => ({
    id: e.id,
    projectId,
    sourceId: e.sourceId,
    targetId: e.targetId,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
    label: e.label ?? undefined,
    type: e.type ?? undefined,
  }));
}

export async function createEdge(
  edge: ComponentEdgeType,
  projectId: string,
): Promise<ProjectEdgeModel> {
  await connectToDatabase();
  const created: ProjectEdgeModel = {
    id: edge.id,
    projectId,
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    label: edge.label,
    type: edge.type,
  };
  await ProjectModel.updateOne(
    { _id: projectId },
    {
      $push: {
        edges: {
          id: edge.id,
          sourceId: edge.sourceId,
          targetId: edge.targetId,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          label: edge.label,
          type: edge.type,
        },
      },
    },
  );
  return created;
}

export async function updateEdge(
  id: string,
  updated: Partial<ProjectEdgeModel>,
): Promise<ProjectEdgeModel | undefined> {
  await connectToDatabase();
  const projectId = await findProjectIdBySubdoc("edges", id);
  if (!projectId) return undefined;

  const set: Record<string, unknown> = {};
  if ("sourceId" in updated) set["edges.$[edge].sourceId"] = updated.sourceId;
  if ("targetId" in updated) set["edges.$[edge].targetId"] = updated.targetId;
  if ("sourceHandle" in updated) set["edges.$[edge].sourceHandle"] = updated.sourceHandle;
  if ("targetHandle" in updated) set["edges.$[edge].targetHandle"] = updated.targetHandle;
  if ("label" in updated) set["edges.$[edge].label"] = updated.label;
  if ("type" in updated) set["edges.$[edge].type"] = updated.type;

  await ProjectModel.updateOne(
    { _id: projectId },
    { $set: set },
    { arrayFilters: [{ "edge.id": id }] },
  );

  const doc = await ProjectModel.findById(projectId).lean<ProjectDocument>();
  const edge = doc?.edges.find((e) => e.id === id);
  return edge
    ? {
        id: edge.id,
        projectId,
        sourceId: edge.sourceId,
        targetId: edge.targetId,
        sourceHandle: edge.sourceHandle ?? undefined,
        targetHandle: edge.targetHandle ?? undefined,
        label: edge.label ?? undefined,
        type: edge.type ?? undefined,
      }
    : undefined;
}

export async function deleteEdge(id: string): Promise<boolean> {
  await connectToDatabase();
  const projectId = await findProjectIdBySubdoc("edges", id);
  if (!projectId) return false;
  const result = await ProjectModel.updateOne(
    { _id: projectId },
    { $pull: { edges: { id } } },
  );
  return result.modifiedCount === 1;
}

// --- Substitutes ---

export async function getSubstitutesByProjectId(
  projectId: string,
): Promise<ProjectSubstituteModel[]> {
  await connectToDatabase();
  const doc = await ProjectModel.findById(projectId).lean<ProjectDocument>();
  if (!doc) return [];
  return doc.substitutes.map((s) => ({
    id: s.id,
    projectId,
    originalComponentId: s.originalComponentId,
    substituteComponentId: s.substituteComponentId,
  }));
}

export async function createSubstitute(
  substitute: ProjectSubstituteModel,
): Promise<ProjectSubstituteModel> {
  await connectToDatabase();
  await ProjectModel.updateOne(
    { _id: substitute.projectId },
    {
      $push: {
        substitutes: {
          id: substitute.id,
          originalComponentId: substitute.originalComponentId,
          substituteComponentId: substitute.substituteComponentId,
        },
      },
    },
  );
  return substitute;
}

// --- Specs Reports ---

export async function getReportByProjectId(
  projectId: string,
): Promise<ProjectSpecsReportModel | undefined> {
  await connectToDatabase();
  const doc = await ProjectModel.findById(projectId).lean<ProjectDocument>();
  if (!doc || !doc.specsReport) return undefined;
  return {
    id: doc.specsReport.id,
    projectId,
    url: doc.specsReport.url,
  };
}

export async function createReport(
  report: ProjectSpecsReportModel,
): Promise<ProjectSpecsReportModel> {
  await connectToDatabase();
  await ProjectModel.updateOne(
    { _id: report.projectId },
    { $set: { specsReport: { id: report.id, url: report.url } } },
  );
  return report;
}

export async function updateReport(
  id: string,
  updated: Partial<ProjectSpecsReportModel>,
): Promise<ProjectSpecsReportModel | undefined> {
  await connectToDatabase();
  const projectId = await findProjectIdBySubdoc("specsReport", id);
  if (!projectId) return undefined;

  const set: Record<string, unknown> = {};
  if ("url" in updated) set["specsReport.url"] = updated.url;

  await ProjectModel.updateOne({ _id: projectId }, { $set: set });

  const doc = await ProjectModel.findById(projectId).lean<ProjectDocument>();
  if (!doc || !doc.specsReport) return undefined;
  return { id: doc.specsReport.id, projectId, url: doc.specsReport.url };
}

export async function deleteReport(id: string): Promise<boolean> {
  await connectToDatabase();
  const projectId = await findProjectIdBySubdoc("specsReport", id);
  if (!projectId) return false;
  const result = await ProjectModel.updateOne(
    { _id: projectId },
    { $set: { specsReport: null } },
  );
  return result.modifiedCount === 1;
}

// --- Components ---

export async function getComponentsByProjectId(
  projectId: string,
): Promise<ProjectComponentModel[]> {
  await connectToDatabase();
  return getJoinedComponents(projectId);
}

export async function createComponentsBatch(
  components: ProjectComponentModel[],
): Promise<ProjectComponentModel[]> {
  await connectToDatabase();
  if (components.length === 0) return [];
  const projectId = components[0].projectId;
  const mapped = components.map((c) => ({
    id: c.id,
    inventoryId: c.inventoryId,
    qty: c.qty,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
  await ProjectModel.updateOne(
    { _id: projectId },
    { $push: { components: { $each: mapped } } },
  );
  return getJoinedComponents(projectId);
}

export async function createComponent(
  component: ProjectComponentModel,
): Promise<ProjectComponentModel> {
  await connectToDatabase();
  await ProjectModel.updateOne(
    { _id: component.projectId },
    {
      $push: {
        components: {
          id: component.id,
          inventoryId: component.inventoryId,
          qty: component.qty,
          createdAt: component.createdAt,
          updatedAt: component.updatedAt,
        },
      },
    },
  );
  const joined = await getJoinedComponents(component.projectId);
  return joined.find((c) => c.id === component.id)!;
}

export async function updateComponent(
  id: string,
  updated: Partial<ProjectComponentModel>,
): Promise<ProjectComponentModel | undefined> {
  await connectToDatabase();
  const projectId = await findProjectIdBySubdoc("components", id);
  if (!projectId) return undefined;

  const set: Record<string, unknown> = {};
  if ("inventoryId" in updated) set["components.$[comp].inventoryId"] = updated.inventoryId;
  if ("qty" in updated) set["components.$[comp].qty"] = updated.qty;
  if ("createdAt" in updated) set["components.$[comp].createdAt"] = updated.createdAt;
  if ("updatedAt" in updated) set["components.$[comp].updatedAt"] = updated.updatedAt;

  await ProjectModel.updateOne(
    { _id: projectId },
    { $set: set },
    { arrayFilters: [{ "comp.id": id }] },
  );

  const joined = await getJoinedComponents(projectId);
  return joined.find((c) => c.id === id);
}

export async function deleteComponent(id: string): Promise<boolean> {
  await connectToDatabase();
  const projectId = await findProjectIdBySubdoc("components", id);
  if (!projectId) return false;
  const result = await ProjectModel.updateOne(
    { _id: projectId },
    { $pull: { components: { id } } },
  );
  return result.modifiedCount === 1;
}
