
import { GoogleGenAI } from "@google/genai";
import { CrisisActionPlan, MultimodalInput, GroundingLink } from "../types";

const SYSTEM_INSTRUCTION = `You are an expert Crisis Management Coordinator. 
Analyze multimodal inputs (text, images, audio, docs) and provide a structured Crisis Action Plan.

Your response MUST be a single, valid JSON object. 
Do not include any introductory text, and do not use markdown code blocks like \`\`\`json.

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
  // Access API key safely
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
  
  if (!apiKey) {
    throw new Error("API_KEY is not defined in the environment.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Extract coordinates for toolConfig if present in text inputs
  let latitude: number | undefined;
  let longitude: number | undefined;
  
  const parts = inputs.map(input => {
    if (input.type === 'text') {
      // Regex to find "lat, lng" in the generated CRISIS REPORT string
      const coordMatch = input.data.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
      if (coordMatch) {
        latitude = parseFloat(coordMatch[1]);
        longitude = parseFloat(coordMatch[2]);
      }
      return { text: input.data };
    }
    
    // For non-text inputs, extract base64 data correctly from DataURLs
    const dataParts = input.data.split(',');
    const base64Data = dataParts.length > 1 ? dataParts[1] : dataParts[0];
    
    return {
      inlineData: {
        data: base64Data,
        mimeType: input.mimeType || 'application/octet-stream'
      }
    };
  });

  parts.push({ text: "Produce the JSON Crisis Action Plan now based on all provided evidence and instructions." });

  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ googleSearch: {} }, { googleMaps: {} }],
  };

  // Maps grounding works best with explicit coordinates in toolConfig
  if (latitude !== undefined && longitude !== undefined) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude,
          longitude
        }
      }
    };
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ parts }],
    config: config
  });

  const text = response.text || "";
  
  // Extract JSON using a more resilient method
  let plan: CrisisActionPlan;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    plan = JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON. Raw text:", text);
    throw new Error("Reasoning failed: The AI response was not in a valid format.");
  }

  // Extract grounding metadata for UI display
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
