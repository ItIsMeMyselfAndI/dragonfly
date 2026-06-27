export type ConnectionType = "power" | "signal" | "logic" | "i2c";

export type ProjectTag =
  | "Robotics"
  | "IoT"
  | "Power"
  | "Networking"
  | "Mechatronics"
  | "AI Generated";

export interface ProjectNode {
  id: string;
  positionX: number;
  positionY: number;
}

export interface ProjectEdge {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle?: "top" | "bottom" | "left" | "right";
  targetHandle?: "top" | "bottom" | "left" | "right";
  label?: string;
  type?: ConnectionType;
}

export interface ProjectDefinition {
  id: string;
  name: string;
  time: string;
  tag: ProjectTag;
  nodes: ProjectNode[];
  edges: ProjectEdge[];
  substitutes?: Record<string, string[]>;
}

export interface ProjectModel {
  id: string;
  name: string;
  time: string;
  tag: ProjectTag;
}

export interface ProjectNodeModel extends ProjectNode {
  projectId: string;
  componentId: string;
}
export interface ProjectEdgeModel extends ProjectEdge {
  projectId: string;
}

export interface ProjectSubstituteModel {
  id: string;
  projectId: string;
  originalComponentId: string;
  substituteComponentId: string;
}
