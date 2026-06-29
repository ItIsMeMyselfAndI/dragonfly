import { Component } from "../inventory/types";

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
  type?: ConnectionEnum;
}

export interface ProjectDefinition {
  id: string;
  name: string;
  time: string;
  tag: ProjectTagEnum;
  cart?: any[];
  nodes: ProjectNode[];
  edges: ProjectEdge[];
  substitutes?: Record<string, string[]>;
}

export interface ProjectCartSummary {
  id: string;
  name: string;
  tag: ProjectTagEnum;
  timestamp: string;
  totalPrice: number;
  items: (Component & { qtyPrice: number })[];
}

export interface ProjectModel {
  id: string;
  name: string;
  time: string;
  tag: ProjectTagEnum;
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
