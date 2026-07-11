import {
  ProjectModel,
  ProjectNodeModel,
  ProjectEdgeModel,
  ProjectSubstituteModel,
  ProjectComponentModel,
  ProjectSpecsReportModel,
  ComponentNodeType,
  ComponentEdgeType,
} from "./types";

// const API_BASE = "/api/v1/projects";
const API_BASE = "/api/v2/projects";

export async function getAllProjects(): Promise<ProjectModel[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Failed to fetch projects (${res.status})`);
  }
  return res.json();
}

export async function getProject(id: string): Promise<ProjectModel> {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error("Failed to fetch project");
  return res.json();
}

export async function createProject(
  project: ProjectModel,
): Promise<ProjectModel> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error("Failed to create project");
  return res.json();
}

export async function updateProject(
  id: string,
  project: Partial<ProjectModel>,
): Promise<ProjectModel> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error("Failed to update project");
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete project");
}

// Project Specific Data
export async function getProjectNodes(
  projectId: string,
): Promise<ProjectNodeModel[]> {
  const res = await fetch(`${API_BASE}/${projectId}/nodes`);
  if (!res.ok) throw new Error("Failed to fetch project nodes");
  return res.json();
}

export async function createProjectNode(
  node: ComponentNodeType,
  projectId: string,
): Promise<ProjectNodeModel> {
  const res = await fetch(`${API_BASE}/${projectId}/nodes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(node),
  });
  if (!res.ok) throw new Error("Failed to create project node");
  return res.json();
}

export async function createProjectEdge(
  edge: ComponentEdgeType,
  projectId: string,
): Promise<ProjectEdgeModel> {
  const res = await fetch(`${API_BASE}/${projectId}/edges`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(edge),
  });
  if (!res.ok) throw new Error("Failed to create project edge");
  return res.json();
}

export async function createProjectNodesBatch(
  projectId: string,
  nodes: ComponentNodeType[],
): Promise<ProjectNodeModel[]> {
  const res = await fetch(`${API_BASE}/${projectId}/nodes/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nodes),
  });
  if (!res.ok) throw new Error("Failed to create project nodes batch");
  return res.json();
}

export async function createProjectEdgesBatch(
  projectId: string,
  edges: ComponentEdgeType[],
): Promise<ProjectEdgeModel[]> {
  const res = await fetch(`${API_BASE}/${projectId}/edges/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(edges),
  });
  if (!res.ok) throw new Error("Failed to create project edges batch");
  return res.json();
}

export async function createProjectComponentsBatch(
  projectId: string,
  components: Omit<ProjectComponentModel, "projectId">[],
): Promise<ProjectComponentModel[]> {
  const res = await fetch(`${API_BASE}/${projectId}/components/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(components),
  });
  if (!res.ok) throw new Error("Failed to create project components batch");
  return res.json();
}

export async function updateProjectNode(
  nodeId: string,
  updated: Partial<ProjectNodeModel>,
): Promise<ProjectNodeModel> {
  const res = await fetch(`${API_BASE}/nodes/${nodeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updated),
  });
  if (!res.ok) throw new Error("Failed to update project node");
  return res.json();
}

export async function getProjectEdges(
  projectId: string,
): Promise<ProjectEdgeModel[]> {
  const res = await fetch(`${API_BASE}/${projectId}/edges`);
  if (!res.ok) throw new Error("Failed to fetch project edges");
  return res.json();
}

// Node creation method is replaced by bulk method.


export async function updateProjectEdge(
  edgeId: string,
  updated: Partial<ProjectEdgeModel>,
): Promise<ProjectEdgeModel> {
  const res = await fetch(`${API_BASE}/edges/${edgeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updated),
  });
  if (!res.ok) throw new Error("Failed to update project edge");
  return res.json();
}

export async function deleteProjectEdge(edgeId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/edges/${edgeId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete project edge");
}

export async function getProjectSubstitutes(
  projectId: string,
): Promise<ProjectSubstituteModel[]> {
  const res = await fetch(`${API_BASE}/${projectId}/substitutes`);
  if (!res.ok) throw new Error("Failed to fetch project substitutes");
  return res.json();
}

export async function createProjectSubstitute(
  substitute: ProjectSubstituteModel,
): Promise<ProjectSubstituteModel> {
  const res = await fetch(`${API_BASE}/${substitute.projectId}/substitutes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(substitute),
  });
  if (!res.ok) throw new Error("Failed to create project substitute");
  return res.json();
}

export async function getProjectReport(
  projectId: string,
): Promise<ProjectSpecsReportModel | undefined> {
  const res = await fetch(`${API_BASE}/${projectId}/report`);
  if (!res.ok) {
    if (res.status === 404) return undefined;
    throw new Error("Failed to fetch project report");
  }
  return res.json();
}

export async function createProjectReport(
  report: ProjectSpecsReportModel,
): Promise<ProjectSpecsReportModel> {
  const res = await fetch(`${API_BASE}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  });
  if (!res.ok) throw new Error("Failed to create project report");
  return res.json();
}

export async function updateProjectReport(
  id: string,
  updated: Partial<ProjectSpecsReportModel>,
): Promise<ProjectSpecsReportModel> {
  const res = await fetch(`${API_BASE}/reports/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updated),
  });
  if (!res.ok) throw new Error("Failed to update project report");
  return res.json();
}

export async function deleteProjectReport(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/reports/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete project report");
}

export async function getProjectComponents(
  projectId: string,
): Promise<ProjectComponentModel[]> {
  const res = await fetch(`${API_BASE}/${projectId}/components`);
  if (!res.ok) throw new Error("Failed to fetch project components");
  return res.json();
}

export async function createProjectComponent(
  projectId: string,
  component: Omit<ProjectComponentModel, "projectId">,
): Promise<ProjectComponentModel> {
  const res = await fetch(`${API_BASE}/${projectId}/components`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(component),
  });
  if (!res.ok) throw new Error("Failed to create project component");
  return res.json();
}

export async function updateProjectComponent(
  projectId: string,
  componentId: string,
  updated: Partial<ProjectComponentModel>,
): Promise<ProjectComponentModel> {
  const res = await fetch(
    `${API_BASE}/${projectId}/components/${componentId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    },
  );
  if (!res.ok) throw new Error("Failed to update project component");
  return res.json();
}

export async function deleteProjectComponent(
  projectId: string,
  componentId: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/${projectId}/components/${componentId}`,
    {
      method: "DELETE",
    },
  );
  if (!res.ok) throw new Error("Failed to delete project component");
}
