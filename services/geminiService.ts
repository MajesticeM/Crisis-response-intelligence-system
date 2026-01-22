
import { GoogleGenAI } from "@google/genai";
import { CrisisActionPlan, MultimodalInput, GroundingLink } from "../types";

const SYSTEM_INSTRUCTION = `You are an expert Crisis Management Coordinator. 
Your task is to analyze multimodal inputs (text, images, audio, documents) and synthesize a high-stakes Crisis Action Plan.

Since you are using grounding tools, you MUST NOT use a restricted JSON response mode. 
Instead, provide your analysis as a structured JSON object within your text response.

Schema Requirements:
{
  "title": "Clear Incident Name",
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "situationSummary": "Brief overview of the threat environment",
  "immediateActions": [{ "task": "specific action", "assignedRole": "lead entity", "urgency": "IMMEDIATE" | "FOLLOW-UP" }],
  "safetyAlerts": ["specific hazard warnings"],
  "resourceChecklist": ["required equipment or personnel"],
  "communicationStrategy": { "internal": "Team protocols", "external": "Public messaging" },
  "longTermRecovery": ["steps for post-incident stabilization"]
}`;

export const generateCrisisPlan = async (inputs: MultimodalInput[]): Promise<CrisisActionPlan> => {
  // Initialize inside the function to ensure process.env.API_KEY is accessed at runtime.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let latitude: number | undefined;
  let longitude: number | undefined;
  
  const parts = inputs.map(input => {
    if (input.type === 'text') {
      // Extract coordinates if present in the text string (lat, lng)
      const coordMatch = input.data.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
      if (coordMatch) {
        latitude = parseFloat(coordMatch[1]);
        longitude = parseFloat(coordMatch[2]);
      }
      return { text: input.data };
    }
    
    // Clean base64 data
    const base64Data = input.data.includes(',') ? input.data.split(',')[1] : input.data;
    
    return {
      inlineData: {
        data: base64Data,
        mimeType: input.mimeType || 'application/octet-stream'
      }
    };
  });

  parts.push({ text: "Based on the evidence above and your real-time grounding tools, output the Crisis Action Plan as a JSON object." });

  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ googleSearch: {} }, { googleMaps: {} }],
  };

  // Maps grounding requires latLng in toolConfig for precision
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
  
  // Resilient JSON extraction
  let plan: CrisisActionPlan;
  try {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    if (jsonStart === -1 || jsonEnd === 0) throw new Error("No JSON found in response");
    
    const jsonStr = text.substring(jsonStart, jsonEnd);
    plan = JSON.parse(jsonStr);
  } catch (e) {
    console.error("Gemini Parse Error. Raw text:", text);
    throw new Error("The AI failed to generate a valid protocol format. Please check your inputs and try again.");
  }

  // Handle grounding citations
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    plan.groundingLinks = groundingChunks.map((chunk: any) => {
      if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
      if (chunk.maps) return { title: chunk.maps.title || "Map Location", uri: chunk.maps.uri };
      return null;
    }).filter((l: any) => l !== null) as GroundingLink[];
  }

  return plan;
};
