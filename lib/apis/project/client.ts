import {
  ProjectModel,
  ProjectNodeModel,
  ProjectEdgeModel,
  ProjectSubstituteModel,
  ProjectComponentModel,
} from "./types";

// const API_BASE = "/api/v1/projects";
const API_BASE = "/api/v2/projects";

export async function getAllProjects(): Promise<ProjectModel[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Failed to fetch projects");
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
  node: ProjectNodeModel,
): Promise<ProjectNodeModel> {
  const res = await fetch(`${API_BASE}/nodes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(node),
  });
  if (!res.ok) throw new Error("Failed to create project node");
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

export async function createProjectEdge(
  edge: ProjectEdgeModel,
): Promise<ProjectEdgeModel> {
  const res = await fetch(`${API_BASE}/edges`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(edge),
  });
  if (!res.ok) throw new Error("Failed to create project edge");
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
  const res = await fetch(`${API_BASE}/${projectId}/components/${componentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updated),
  });
  if (!res.ok) throw new Error("Failed to update project component");
  return res.json();
}

export async function deleteProjectComponent(
  projectId: string,
  componentId: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/${projectId}/components/${componentId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete project component");
}
