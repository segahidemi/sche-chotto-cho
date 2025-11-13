export type Availability = "available" | "maybe" | "unavailable";

export const AVAILABILITY_SYMBOL: Record<Availability, string> = {
  available: "◯",
  maybe: "△",
  unavailable: "✕",
};

export interface ParticipantResponse {
  id: string;
  name: string;
  comment?: string;
  answers: Record<string, Availability>;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  title: string;
  description?: string;
  candidates: string[];
  createdAt: string;
  responses: ParticipantResponse[];
}

export interface CreateSchedulePayload {
  title: string;
  description?: string;
  candidates: string[];
}

export interface ResponsePayload {
  name: string;
  comment?: string;
  answers: Record<string, Availability>;
}
