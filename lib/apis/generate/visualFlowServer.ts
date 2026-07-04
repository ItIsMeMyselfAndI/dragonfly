import { GoogleGenAI } from "@google/genai";
import { getNextApiKey } from "./keyCycler";
import { runWithModelFallback } from "./utils";
import { GeneratedFlow } from "./types";
import { VisualFlowSchema } from "./visualFlowSchema";

export async function generateVisualFlowLogic(
  bomComponentsContext: string,
  specsContext: string,
  prompt: string | null,
  image: File | null,
  projectId: string,
): Promise<GeneratedFlow> {
  const ai = new GoogleGenAI({ apiKey: getNextApiKey() });

  const contents = [];
  if (image) {
    const buffer = Buffer.from(await image.arrayBuffer());
    contents.push({
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: image.type,
      },
    });
  }
  if (prompt) {
    contents.push({ text: prompt });
  }
  contents.push({
    text: `Based on the following Bill of Materials (BOM) and specs calculation, generate a visual signal and power flow diagram.
    
    BOM COMPONENTS CONTEXT:
    {
    ${bomComponentsContext}
    }

    SPECS CONTEXT:
    {
    ${specsContext}
    }
    `,
  });

  const generatedFlow = await runWithModelFallback(
    ai,
    contents,
    {
      systemInstruction: `You are an expert System Architect. Your task is to generate a visual BLOCK DIAGRAM showing the signal and power flow of a system based on the provided Bill of Materials.

    CRITICAL INSTRUCTIONS:
    1. BLOCK DIAGRAM ONLY: Do NOT generate a circuit diagram. Do NOT create closed-loop circuits or cyclic feedback paths. The diagram must represent a unidirectional functional flow (e.g., Sensor -> MCU -> Actuator).
    2. EXHAUSTIVE MAPPING: Every single component identified in the BOM CONTEXT must have a corresponding node.
    3. HIERARCHICAL FLOW: Connections should represent functional flow of data, signal, or power, not raw wiring.
    4. EDGE TYPES: Assign a type from the following set: 'power', 'signal', 'logic', 'i2c'.
    5. STRICT NAMING: The 'id' of each node MUST exactly match the component ID as listed in the BOM.
    6. SPATIAL LAYOUT: Enforce a strictly VERTICAL, TOP-TO-BOTTOM layout. Components providing input (sensors, power) should have smaller Y values (at the top). Processing components (MCUs) should be in the middle. Output components (actuators, displays) should have larger Y values (at the bottom). Components at the same logical level should have the same Y value but must be spread significantly along the X-axis (min 250px horizontal spacing) to guarantee absolutely no overlapping of nodes. Prioritize clear horizontal spacing for nodes at the same level to maintain readability. Ensure a minimum vertical distance of at least 150px between different hierarchical levels (Y-axis spacing) to ensure edges are clearly visible and not too short. Maintain a clean, linear, non-overlapping flow.
    7. NODE ID CONSISTENCY: Follow the format 'node-{index}-{projectId}' for node IDs, where {index} is the zero-based index of the node in the nodes array and {projectId} is the unique identifier for the project. This ensures that each node ID is unique across different projects.
    8. EDGE ID CONSISTENCY: Follow the format 'edge-{index}-{projectId}' for edge IDs, where {index} is the zero-based index of the edge in the edges array and {projectId} is the unique identifier for the project. This ensures that each edge ID is unique across different projects.
    9. SOURCE AND TARGET ID CONSISTENCY: For each edge, the 'sourceId' and 'targetId' must reference the corresponding node IDs in the format 'node-{index}-{projectId}' to ensure proper linkage between nodes and edges.
    10. PROJECT ID: Here is the project ID for reference: ${projectId}.
    11. COMPONENT ID: Each node's 'componentId' must match the corresponding IDs from the components, not the items, from the BOM CONTEXT to ensure accurate mapping between nodes and components.
    `,
      responseMimeType: "application/json",
      responseSchema: VisualFlowSchema,
    },
    (text) => JSON.parse(text || "{}") as GeneratedFlow,
  );

  return generatedFlow;
}
