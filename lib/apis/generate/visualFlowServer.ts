import { AIMessage, AIConfig } from "@/lib/ai/aiService";
import { ProviderType } from "@/lib/ai/types";
import { ProviderConfigManager } from "@/lib/ai/providerConfig";
import { ImageProcessor } from "@/lib/ai/imageProcessor";
import { GeminiGenAIProvider } from "@/lib/ai/providers/geminiGenAIProvider";
import { OpenAIProvider } from "@/lib/ai/providers/openaiProvider";
import { OpenRouterProvider } from "@/lib/ai/providers/openrouterProvider";
import { ChatGPTProvider } from "@/lib/ai/providers/chatgptProvider";
import { GeneratedFlow } from "./types";
import { VisualFlowSchema } from "./visualFlowSchema";

const providerConfig = new ProviderConfigManager();

function createProvider(providerType: ProviderType, apiKey: string) {
  switch (providerType) {
    case ProviderType.GEMINI:
      return new GeminiGenAIProvider(apiKey);
    case ProviderType.OPENAI:
      return new OpenAIProvider(apiKey);
    case ProviderType.OPENROUTER:
      return new OpenRouterProvider(apiKey);
    case ProviderType.CHATGPT:
      return new ChatGPTProvider(apiKey);
    default:
      return new GeminiGenAIProvider(apiKey);
  }
}

export async function generateVisualFlowLogic(
  bomComponentsContext: string,
  specsContext: string,
  prompt: string | null,
  image: File | null,
  projectId: string,
  providerType: ProviderType = ProviderType.GEMINI,
): Promise<GeneratedFlow> {
  const contents: AIMessage[] = [];
  if (image) {
    const { data, mimeType } = await ImageProcessor.toBase64(image);
    contents.push({
      role: "user",
      content: "",
      inlineData: { data, mimeType },
    });
  }
  if (prompt) {
    contents.push({
      role: "user",
      content: prompt,
    });
  }

  contents.push({
    role: "user",
    content: `Based on the following Bill of Materials (BOM) and specs calculation, generate a visual signal and power flow diagram.

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

  const apiKey = providerConfig.getNextKey(providerType);
  const provider = createProvider(providerType, apiKey);

  const config: AIConfig = {
    model: "gemini-2.5-flash-lite",
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
  };

  const response = await provider.generate(
    contents,
    config,
    (text) => JSON.parse(text || "{}") as GeneratedFlow,
  );

  return response.data;
}
