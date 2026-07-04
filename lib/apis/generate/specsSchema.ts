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
          componentName: {
            type: Type.STRING,
            description:
              "Name of the component for which the specs are computed.",
          },
          computedSpecs: {
            type: Type.STRING,
            description:
              "The computed specifications for the component, derived from the analysis.",
          },
          reasoning: {
            type: Type.STRING,
            description: "The reasoning behind the computed specifications.",
          },
          calculation: {
            type: Type.OBJECT,
            properties: {
              formula: {
                type: Type.STRING,
                description: "The formula used for the calculation.",
              },
              result: {
                type: Type.STRING,
                description: "The result of the calculation.",
              },
            },
            required: ["formula", "result"],
          },
        },
        required: [
          "componentName",
          "computedSpecs",
          "reasoning",
          "calculation",
        ],
      },
    },
    summary: { type: Type.STRING },
  },
  required: ["specs", "summary"],
};
