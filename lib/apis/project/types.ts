import { ItemModel } from "../inventory/types";

export enum ConnectionEnum {
  POWER = "power",
  SIGNAL = "signal",
  LOGIC = "logic",
  I2C = "i2c",
}
//   POWER: "power",
//   SIGNAL: "signal",
//   LOGIC: "logic",
//   I2C: "i2c",
// } as const;

// export type ConnectionType =
//   (typeof ConnectionEnum)[keyof typeof ConnectionEnum];

export enum ProjectTagEnum {
  ROBOTICS = "Robotics",
  IOT = "IoT",
  POWER = "Power",
  NETWORKING = "Networking",
  MECHATRONICS = "Mechatronics",
  NA = "N/A",
}

// export type ProjectTagEnum = keyof typeof ProjectTagEnum;

export interface ComponentNodeType {
  id: string;
  componentId: string;
  positionX: number;
  positionY: number;
}

export interface ComponentEdgeType {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle?: "top" | "bottom" | "left" | "right";
  targetHandle?: "top" | "bottom" | "left" | "right";
  label?: string;
  type?: ConnectionEnum;
}

export interface ProjectDefinition {
  id: string;
  name: string;
  time: string;
  tag: ProjectTagEnum;
  nodes: ComponentNodeType[];
  edges: ComponentEdgeType[];
  substitutes?: Record<string, string[]>;
}

export interface ProjectCartSummary {
  id: string;
  name: string;
  tag: ProjectTagEnum;
  timestamp: string;
  totalPrice: number;
  items: (ProjectComponentModel & { qtyPrice: number })[];
}

export interface ProjectModel {
  id: string;
  name: string;
  time: string;
  tag: ProjectTagEnum;
  userId?: string | null;
  isPublic?: boolean;
}

export interface ProjectNodeModel extends ComponentNodeType {
  projectId: string;
}
export interface ProjectEdgeModel extends ComponentEdgeType {
  projectId: string;
}

export interface ProjectSubstituteModel {
  id: string;
  projectId: string;
  originalComponentId: string;
  substituteComponentId: string;
}

export interface ProjectSpecsReportModel {
  id: string;
  projectId: string;
  url: string;
}

export interface ProjectComponentModel extends Omit<ItemModel, "id"> {
  id: string;
  projectId: string;
  inventoryId: string;
  qty: number;
  createdAt?: string;
  updatedAt?: string;
}
