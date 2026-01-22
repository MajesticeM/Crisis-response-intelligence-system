
export enum SeverityLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export interface ActionItem {
  task: string;
  assignedRole: string;
  urgency: 'IMMEDIATE' | 'FOLLOW-UP';
}

export interface GroundingLink {
  title: string;
  uri: string;
}

export interface CrisisActionPlan {
  title: string;
  severity: SeverityLevel;
  situationSummary: string;
  immediateActions: ActionItem[];
  safetyAlerts: string[];
  resourceChecklist: string[];
  communicationStrategy: {
    internal: string;
    external: string;
  };
  longTermRecovery: string[];
  groundingLinks?: GroundingLink[];
}

export interface MultimodalInput {
  type: 'text' | 'image' | 'audio' | 'document';
  data: string; // Base64 or plain text
  mimeType?: string;
  fileName?: string;
}
