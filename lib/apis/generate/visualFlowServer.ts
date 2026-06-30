import { GoogleGenAI } from "@google/genai";
import { getNextApiKey } from "./keyCycler";

export async function generateVisualFlowLogic(
  specsContext: string,
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
    text: `Based on the following technical specifications, generate a visual signal and power flow diagram.
    
    SPECS CONTEXT:
    ${specsContext}`,
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: contents,
    config: {
      systemInstruction: `You are an expert System Architect and Electronics Engineer. Your task is to generate a visual dependency and signal flow mapping for an electronic circuit.

CRITICAL INSTRUCTIONS:
1. Map every component identified in the specs to a node.
2. Establish edges representing power (VCC/GND), signal, logic, or I2C connections between components.
3. For every edge, assign a type from the following set: 'power', 'signal', 'logic', 'i2c'.
4. Use consistent naming for nodes that matches the components in the specs.
5. Assign plausible but organized spatial coordinates (positionX, positionY) for the nodes to ensure a clean, non-overlapping layout.

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
