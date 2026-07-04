import { Type, Schema } from "@google/genai";
import { ConnectionEnum, ProjectTagEnum } from "../project/types";

export const VisualFlowSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: "The name of the generated visual flow diagram.",
    },
    tag: {
      type: Type.STRING,
      enum: Object.values(ProjectTagEnum),
      description: "The most appropriate category tag for this project flow.",
    },
    nodes: {
      type: Type.ARRAY,
      description:
        "List of nodes representing components in the block diagram.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description:
              "Unique identifier for the node (e.g., node-{index}-{projectId}).",
          },
          componentId: {
            type: Type.STRING,
            description: "The exact component ID from the BOM components list.",
          },
          positionX: {
            type: Type.NUMBER,
            description:
              "The X coordinate for spatial layout (horizontal spacing).",
          },
          positionY: {
            type: Type.NUMBER,
            description:
              "The Y coordinate for spatial layout (vertical top-to-bottom hierarchy).",
          },
        },
        required: ["id", "componentId", "positionX", "positionY"],
      },
    },
    edges: {
      type: Type.ARRAY,
      description:
        "List of edges representing signal and power flow between nodes.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description:
              "Unique identifier for the edge (e.g., edge-{index}-{projectId}).",
          },
          sourceId: {
            type: Type.STRING,
            description: "The node ID where the flow originates.",
          },
          targetId: {
            type: Type.STRING,
            description: "The node ID where the flow terminates.",
          },
          label: {
            type: Type.STRING,
            description:
              "A short descriptive label for the connection (e.g., '5V', 'PWM', 'Data').",
          },
          type: {
            type: Type.STRING,
            enum: Object.values(ConnectionEnum),
            description: "The functional type of the connection.",
          },
        },
        required: ["id", "sourceId", "targetId", "label", "type"],
      },
    },
  },
  required: ["name", "tag", "nodes", "edges"],
};
