import { Type, Schema } from "@google/genai";

export const SpecsExtractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    specs: {
      type: Type.ARRAY,
      description: "List of computed specifications for components.",
      items: {
        type: Type.OBJECT,
        properties: {
          componentName: { type: Type.STRING },
          computedSpecs: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          calculation: {
            type: Type.OBJECT,
            properties: {
              formula: { type: Type.STRING },
              result: { type: Type.STRING },
            },
            required: ["formula", "result"],
          },
        },
        required: ["componentName", "computedSpecs", "reasoning", "calculation"],
      },
    },
    summary: { type: Type.STRING },
  },
  required: ["specs", "summary"],
};
