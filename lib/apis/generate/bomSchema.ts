import { Type, Schema } from "@google/genai";
import { ProjectTagEnum } from "../project/types";
import { ItemCategory, MountType, StockStatus } from "../inventory/types";

const itemsSchema = {
  type: Type.ARRAY,
  description: "List of new inventory items extracted from the schematic.",
  items: {
    type: Type.OBJECT,
    properties: {
      id: {
        type: Type.STRING,
        description:
          "Unique identifier for the item (e.g., item-{index}-{suffix}).",
      },
      name: {
        type: Type.STRING,
        description: "Generic name (e.g., Motor Driver)",
      },
      partNumber: {
        type: Type.STRING,
        description: "Exact part number (e.g., TB6612FNG)",
      },
      shortDesc: {
        type: Type.STRING,
        description: "Concise specs (e.g., 7.4V · 2600mAh · JST)",
      },
      unitPrice: { type: Type.NUMBER },
      stock: { type: Type.STRING, enum: Object.values(StockStatus) },
      stockCount: { type: Type.INTEGER },
      category: {
        type: Type.STRING,
        enum: Object.values(ItemCategory),
      },
      pins: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "List of pin names or numbers for the component, if applicable.",
      },
      details: {
        type: Type.OBJECT,
        properties: {
          inventoryId: {
            type: Type.STRING,
            description: "Reference to the corresponding inventory item ID.",
          },
          mounting: { type: Type.STRING, enum: Object.values(MountType) },
          package: { type: Type.STRING },
          voltageMin: { type: Type.NUMBER },
          voltageMax: { type: Type.NUMBER },
          primaryValue: { type: Type.STRING },
          powerRating: { type: Type.STRING },
          tolerance: { type: Type.STRING },
          forwardVoltage: { type: Type.STRING },
          maxCurrent: { type: Type.STRING },
          thresholdVoltage: { type: Type.STRING },
          logicFamily: { type: Type.STRING },
          ioVoltage: { type: Type.NUMBER },
          pinCount: { type: Type.INTEGER },
          nominalVoltage: { type: Type.NUMBER },
          currentDraw: { type: Type.STRING },
          contactRating: { type: Type.STRING },
        },
        required: ["inventoryId", "mounting", "package"],
      },
    },
    required: [
      "id",
      "name",
      "partNumber",
      "shortDesc",
      "unitPrice",
      "stock",
      "stockCount",
      "category",
      "pins",
      "details",
    ],
  },
};

// derive components from items
const componentsSchema = {
  type: Type.ARRAY,
  description: "List of components, derived from the items.",
  items: {
    type: Type.OBJECT,
    properties: {
      ...JSON.parse(JSON.stringify(itemsSchema.items.properties)),
      id: {
        type: Type.STRING,
        description:
          "Unique identifier for the component (e.g., comp-{index}-{projectId}).",
      },
      projectId: { type: Type.STRING },
      inventoryId: {
        type: Type.STRING,
        description:
          "Reference to the corresponding inventory item ID (e.g., item-{index}-{suffix}).",
      },
      qty: { type: Type.INTEGER, description: "Quantity of this component." },
    },
    required: [
      "id",
      "projectId",
      "inventoryId",
      "qty",
      "name",
      "partNumber",
      "shortDesc",
      "unitPrice",
      "stock",
      "stockCount",
      "category",
      "pins",
      "details",
    ],
  },
};

const alertsSchema = {
  type: Type.ARRAY,
  description:
    "Circuit compatibility or safety warnings (e.g., missing flyback diodes).",
  items: {
    type: Type.OBJECT,
    properties: {
      severity: { type: Type.STRING, enum: ["warning", "info"] },
      title: { type: Type.STRING },
      message: { type: Type.STRING },
      partReference: {
        type: Type.STRING,
        description: "The partNumber this alert relates to, if any.",
      },
    },
    required: ["severity", "title", "message"],
  },
};

export const BomExtractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    items: itemsSchema,
    components: componentsSchema,
    alerts: alertsSchema,
    tag: {
      type: Type.STRING,
      enum: Object.values(ProjectTagEnum),
      description: "The most appropriate category tag for this project.",
    },
  },
  required: ["items", "components", "alerts", "tag"],
};
