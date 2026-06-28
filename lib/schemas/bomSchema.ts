import { Type, Schema } from "@google/genai";

export const BomExtractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      description: "List of components extracted from the schematic.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Generic name (e.g., Motor Driver)" },
          partNumber: { type: Type.STRING, description: "Exact part number (e.g., TB6612FNG)" },
          specs: { type: Type.STRING, description: "Computed specs and reasoning for upgrade if applicable" },
          qty: { type: Type.INTEGER },
          category: {
            type: Type.STRING,
            enum: ["MCU", "Sensor", "Actuator", "Logic", "Power", "Passive"],
          },
        },
        required: ["name", "partNumber", "specs", "qty", "category"],
      },
    },
    alerts: {
      type: Type.ARRAY,
      description: "Circuit compatibility or safety warnings (e.g., missing flyback diodes).",
      items: {
        type: Type.OBJECT,
        properties: {
          severity: { type: Type.STRING, enum: ["warning", "info"] },
          title: { type: Type.STRING },
          message: { type: Type.STRING },
          partReference: { type: Type.STRING, description: "The partNumber this alert relates to, if any." }
        },
        required: ["severity", "title", "message"],
      },
    },
    tag: {
      type: Type.STRING,
      enum: ["Robotics", "IoT", "Power", "Networking", "Mechatronics", "N/A"],
      description: "The most appropriate category tag for this project.",
    },
  },
  required: ["items", "alerts", "tag"],

};
