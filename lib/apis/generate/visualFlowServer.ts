import { GoogleGenAI } from "@google/genai";
import { getNextApiKey } from "./keyCycler";

export async function generateVisualFlowLogic(
  bomContext: string,
  prompt: string | null,
  image: File | null,
) {
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
    text: `Based on the following Bill of Materials (BOM), generate a visual signal and power flow diagram.
    
    BOM CONTEXT:
    ${bomContext}`,
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: contents,
    config: {
      systemInstruction: `You are an expert System Architect and Electronics Engineer. Your task is to generate a visual dependency and signal flow mapping for an electronic circuit based on the provided Bill of Materials.

CRITICAL INSTRUCTIONS:
1. EXHAUSTIVE MAPPING: Every single component identified in the BOM CONTEXT must have a corresponding node. Do not omit any component.
2. FULL CONNECTIVITY: Establish edges representing power (VCC/GND), signal, logic, or I2C connections based on the component roles defined in the BOM. Every node must be connected to the overall circuit flow via at least one edge.
3. EDGE TYPES: For every edge, assign a type from the following set: 'power', 'signal', 'logic', 'i2c'.
4. STRICT NAMING: The 'id' of each node MUST exactly match the component ID as listed in the BOM. This is critical for database synchronization.
5. SPATIAL LAYOUT: Assign spatial coordinates (positionX, positionY) to enforce a strictly VERTICAL, TOP-TO-BOTTOM layout. Inputs and power sources MUST have smaller Y values (at the top), and outputs or actuators MUST have larger Y values (at the bottom). Nodes should be centered horizontally (constant or narrow-range positionX) to create a clean vertical column, avoiding horizontal spreading. Ensure a clean, non-overlapping layout.

Return JSON with the following structure:
{
  "name": string,
  "tag": "Robotics" | "IoT" | "Power" | "Networking" | "Mechatronics" | "N/A",
  "nodes": [
    { "id": string, "positionX": number, "positionY": number }
  ],
  "edges": [
    { "id": string, "sourceId": string, "targetId": string, "label": string, "type": "power" | "signal" | "logic" | "i2c" }
  ]
}`,
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text || "{}");
}
