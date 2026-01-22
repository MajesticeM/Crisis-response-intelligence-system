
import { GoogleGenAI, Type } from "@google/genai";
import { CrisisActionPlan, MultimodalInput } from "../types";

const SYSTEM_INSTRUCTION = `You are an expert Crisis Management Coordinator and Emergency Response Specialist. 
Your task is to analyze multimodal inputs (text descriptions, images of incident scenes, audio reports, and documents like SOPs or maps) 
to create a highly structured, professional, and actionable Crisis Action Plan. 

Guidelines:
1. Assess the situation severity accurately.
2. Provide clear, step-by-step instructions.
3. Identify safety hazards.
4. Draft communication templates for internal teams and public relations.
5. Focus on life safety first, then property/environment, then reputation/continuity.
6. The output must be valid JSON according to the schema provided.`;

export const generateCrisisPlan = async (inputs: MultimodalInput[]): Promise<CrisisActionPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const contents = inputs.map(input => {
    if (input.type === 'text') {
      return { text: `Situation Report: ${input.data}` };
    } else {
      return {
        inlineData: {
          data: input.data.split(',')[1] || input.data,
          mimeType: input.mimeType || 'application/octet-stream'
        }
      };
    }
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: contents },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
          situationSummary: { type: Type.STRING },
          immediateActions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                task: { type: Type.STRING },
                assignedRole: { type: Type.STRING },
                urgency: { type: Type.STRING, enum: ['IMMEDIATE', 'FOLLOW-UP'] }
              },
              required: ['task', 'assignedRole', 'urgency']
            }
          },
          safetyAlerts: { type: Type.ARRAY, items: { type: Type.STRING } },
          resourceChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
          communicationStrategy: {
            type: Type.OBJECT,
            properties: {
              internal: { type: Type.STRING },
              external: { type: Type.STRING }
            },
            required: ['internal', 'external']
          },
          longTermRecovery: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['title', 'severity', 'situationSummary', 'immediateActions', 'safetyAlerts', 'resourceChecklist', 'communicationStrategy']
      }
    }
  });

  const jsonStr = response.text || "{}";
  return JSON.parse(jsonStr.trim()) as CrisisActionPlan;
};
