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
      unitPrice: {
        type: Type.NUMBER,
        description:
          "Unit price in PHILIPPINE PESO (PHP) - realistic local retail price, NOT USD. e.g. 250.0 means about ₱250.",
      },
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

// derive substitutes from items (alternative inventory parts)
const substitutesSchema = {
  type: Type.ARRAY,
  description:
    "Approved component substitutions. Each entry pairs an ORIGINAL component (from `components`) with an ALTERNATIVE inventory item (present in `items`) that can replace it. The substitute is NOT a separate BOM component - it is an alternative part in the inventory catalog. Generate 2-3 alternatives per component where sensible; the same originalComponentId will appear in multiple entries (one per alternative).",
  items: {
    type: Type.OBJECT,
    properties: {
      originalComponentId: {
        type: Type.STRING,
        description:
          "ID of the original component in `components` (e.g., comp-{index}-{projectId}).",
      },
      substituteComponentId: {
        type: Type.STRING,
        description:
          "ID of the ALTERNATIVE inventory item (e.g., item-sub-{index}-{altIndex}-{suffix}) that can replace the original. This item MUST also be listed in `items`.",
      },
    },
    required: ["originalComponentId", "substituteComponentId"],
  },
};

export const BomExtractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    items: itemsSchema,
    components: componentsSchema,
    substitutes: substitutesSchema,
    alerts: alertsSchema,
    tag: {
      type: Type.STRING,
      enum: Object.values(ProjectTagEnum),
      description: "The most appropriate category tag for this project.",
    },
  },
  required: ["items", "components", "substitutes", "alerts", "tag"],
};
