
import { GoogleGenAI } from "@google/genai";
import { CrisisActionPlan, MultimodalInput, GroundingLink } from "../types";

const SYSTEM_INSTRUCTION = `You are an expert Crisis Management Coordinator. 
Analyze multimodal inputs (text, images, audio, docs) and provide a structured Crisis Action Plan.

Your response MUST be a single JSON object. Do not include markdown formatting like \`\`\`json. 

Schema:
{
  "title": string,
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "situationSummary": string,
  "immediateActions": [{ "task": string, "assignedRole": string, "urgency": "IMMEDIATE" | "FOLLOW-UP" }],
  "safetyAlerts": string[],
  "resourceChecklist": string[],
  "communicationStrategy": { "internal": string, "external": string },
  "longTermRecovery": string[]
}`;

export const generateCrisisPlan = async (inputs: MultimodalInput[]): Promise<CrisisActionPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts = inputs.map(input => {
    if (input.type === 'text') return { text: input.data };
    return {
      inlineData: {
        data: input.data.split(',')[1],
        mimeType: input.mimeType || 'application/octet-stream'
      }
    };
  });

  parts.push({ text: "Generate the Crisis Action Plan JSON now. Ensure it is valid JSON and follows the schema provided in the system instructions." });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ parts }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      // Note: responseMimeType is NOT allowed when using googleMaps tool.
      tools: [{ googleSearch: {} }, { googleMaps: {} }]
    }
  });

  const text = response.text || "";
  
  // Robust JSON extraction
  let plan: CrisisActionPlan;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    plan = JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON", text);
    throw new Error("The AI response was not in the expected format. Please try again.");
  }

  // Extract grounding links if available
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    const links: GroundingLink[] = groundingChunks.map((chunk: any) => {
      if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
      if (chunk.maps) return { title: chunk.maps.title || "Map Location", uri: chunk.maps.uri };
      return null;
    }).filter((l: any) => l !== null);
    plan.groundingLinks = links;
  }

  return plan;
};
