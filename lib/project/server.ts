import { promises as fs } from "fs";
import path from "path";
import {
  ProjectModel,
  ProjectNodeModel,
  ProjectEdgeModel,
  ProjectSubstituteModel,
} from "./types";

const PATHS = {
  projects: path.join(process.cwd(), "data", "projects.json"),
  nodes: path.join(process.cwd(), "data", "project_nodes.json"),
  edges: path.join(process.cwd(), "data", "project_edges.json"),
  substitutes: path.join(process.cwd(), "data", "project_substitutes.json"),
};

async function readJson<T>(filePath: string): Promise<T[]> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if ((error as any).code === "ENOENT") return [];
    throw error;
  }
}

async function writeJson<T>(filePath: string, data: T[]): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// Projects
export async function getAllProjects(): Promise<ProjectModel[]> {
  return await readJson<ProjectModel>(PATHS.projects);
}

export async function getProjectById(
  id: string,
): Promise<ProjectModel | undefined> {
  const projects = await getAllProjects();
  return projects.find((p) => p.id === id);
}

export async function createProject(
  project: ProjectModel,
): Promise<ProjectModel> {
  const projects = await getAllProjects();
  projects.push(project);
  await writeJson(PATHS.projects, projects);
  return project;
}

export async function updateProject(
  id: string,
  updated: Partial<ProjectModel>,
): Promise<ProjectModel | undefined> {
  const projects = await getAllProjects();
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return undefined;
  projects[index] = { ...projects[index], ...updated };
  await writeJson(PATHS.projects, projects);
  return projects[index];
}

export async function deleteProject(id: string): Promise<boolean> {
  const projects = await getAllProjects();
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return false;
  projects.splice(index, 1);
  await writeJson(PATHS.projects, projects);
  return true;
}

// Nodes
export async function getNodesByProjectId(
  projectId: string,
): Promise<ProjectNodeModel[]> {
  const nodes = await readJson<ProjectNodeModel>(PATHS.nodes);
  return nodes.filter((n) => n.projectId === projectId);
}

export async function createNode(
  node: ProjectNodeModel,
): Promise<ProjectNodeModel> {
  const nodes = await readJson<ProjectNodeModel>(PATHS.nodes);
  nodes.push(node);
  await writeJson(PATHS.nodes, nodes);
  return node;
}

export async function updateNode(
  id: string,
  updated: Partial<ProjectNodeModel>,
): Promise<ProjectNodeModel | undefined> {
  const nodes = await readJson<ProjectNodeModel>(PATHS.nodes);
  const index = nodes.findIndex((n) => n.id === id);
  if (index === -1) return undefined;
  nodes[index] = { ...nodes[index], ...updated };
  await writeJson(PATHS.nodes, nodes);
  return nodes[index];
}

export async function deleteNode(id: string): Promise<boolean> {
  const nodes = await readJson<ProjectNodeModel>(PATHS.nodes);
  const index = nodes.findIndex((n) => n.id === id);
  if (index === -1) return false;
  nodes.splice(index, 1);
  await writeJson(PATHS.nodes, nodes);
  return true;
}

// Edges
export async function getEdgesByProjectId(
  projectId: string,
): Promise<ProjectEdgeModel[]> {
  const edges = await readJson<ProjectEdgeModel>(PATHS.edges);
  return edges.filter((e) => e.projectId === projectId);
}

export async function createEdge(
  edge: ProjectEdgeModel,
): Promise<ProjectEdgeModel> {
  const edges = await readJson<ProjectEdgeModel>(PATHS.edges);
  edges.push(edge);
  await writeJson(PATHS.edges, edges);
  return edge;
}

export async function updateEdge(
  id: string,
  updated: Partial<ProjectEdgeModel>,
): Promise<ProjectEdgeModel | undefined> {
  const edges = await readJson<ProjectEdgeModel>(PATHS.edges);
  const index = edges.findIndex((e) => e.id === id);
  if (index === -1) return undefined;
  edges[index] = { ...edges[index], ...updated };
  await writeJson(PATHS.edges, edges);
  return edges[index];
}

export async function deleteEdge(id: string): Promise<boolean> {
  const edges = await readJson<ProjectEdgeModel>(PATHS.edges);
  const index = edges.findIndex((e) => e.id === id);
  if (index === -1) return false;
  edges.splice(index, 1);
  await writeJson(PATHS.edges, edges);
  return true;
}

// Substitutes
export async function getSubstitutesByProjectId(
  projectId: string,
): Promise<ProjectSubstituteModel[]> {
  const substitutes = await readJson<ProjectSubstituteModel>(PATHS.substitutes);
  return substitutes.filter((s) => s.projectId === projectId);
}

export async function createSubstitute(
  substitute: ProjectSubstituteModel,
): Promise<ProjectSubstituteModel> {
  const substitutes = await readJson<ProjectSubstituteModel>(PATHS.substitutes);
  substitutes.push(substitute);
  await writeJson(PATHS.substitutes, substitutes);
  return substitute;
}

export async function deleteSubstitute(id: string): Promise<boolean> {
  const substitutes = await readJson<ProjectSubstituteModel>(PATHS.substitutes);
  const index = substitutes.findIndex((s) => s.id === id);
  if (index === -1) return false;
  substitutes.splice(index, 1);
  await writeJson(PATHS.substitutes, substitutes);
  return true;
}
