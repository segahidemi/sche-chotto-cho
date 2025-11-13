import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { ensureAmplifyConfigured, getAuthMode } from "./amplifyServer";
import type {
  Availability,
  CreateSchedulePayload,
  ResponsePayload,
  Schedule,
} from "./types";

type ScheduleModel = Schema["Schedule"]["type"];
type ParticipantModel = Schema["ParticipantResponse"]["type"];

const ensureClient = () => {
  ensureAmplifyConfigured();
  return generateClient<Schema>({ authMode: getAuthMode() });
};

const throwIfErrors = <T>(
  result: { data: T; errors?: { message?: string }[] } | undefined,
): T => {
  if (!result) {
    throw new Error("Amplify Data returned no result");
  }

  if (result.errors && result.errors.length > 0) {
    const message = result.errors.map((error) => error.message).join(", ");
    throw new Error(message || "Amplify Data request failed");
  }

  return result.data;
};

const normalizeCandidates = (candidates: string[]): string[] => {
  const normalized = candidates
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parsed = new Date(entry);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid candidate date: ${entry}`);
      }
      return parsed.toISOString();
    });

  return Array.from(new Set(normalized));
};

const ensureValidSchedulePayload = (payload: CreateSchedulePayload) => {
  const title = payload.title?.trim();
  if (!title) {
    throw new Error("Title is required");
  }

  const candidates = normalizeCandidates(payload.candidates ?? []);
  if (candidates.length === 0) {
    throw new Error("Provide at least one candidate date/time");
  }

  return {
    title,
    description: payload.description?.trim() || undefined,
    candidates,
  };
};

const normalizeAnswers = (
  candidates: string[],
  answers: Record<string, Availability>,
): Record<string, Availability> => {
  const normalized: Record<string, Availability> = {};

  candidates.forEach((candidate) => {
    const entry = answers?.[candidate];
    normalized[candidate] =
      entry === "available" || entry === "maybe" || entry === "unavailable"
        ? entry
        : "unavailable";
  });

  return normalized;
};

const mapResponse = (
  record: ParticipantModel,
  candidates: string[],
): Schedule["responses"][number] => ({
  id: record.id,
  name: record.name,
  comment: record.comment ?? undefined,
  answers: normalizeAnswers(
    candidates,
    (record.answers as Record<string, Availability>) ?? {},
  ),
  updatedAt: record.updatedAt ?? record.createdAt ?? new Date().toISOString(),
});

const mapSchedule = (
  record: ScheduleModel,
  responses: ParticipantModel[] = [],
): Schedule => {
  const candidates = (record.candidates ?? []).filter(
    (candidate): candidate is string => typeof candidate === "string",
  );
  return {
    id: record.id,
    title: record.title,
    description: record.description ?? undefined,
    candidates,
    createdAt: record.createdAt ?? new Date().toISOString(),
    responses: responses.map((response) => mapResponse(response, candidates)),
  };
};

export const listSchedules = async (): Promise<Schedule[]> => {
  const client = ensureClient();
  const result = await client.models.Schedule.list({
    selectionSet: ["id", "title", "description", "candidates", "createdAt", "updatedAt"],
    limit: 200,
  });
  const schedules = throwIfErrors(result) ?? [];
  return schedules.map((schedule) => mapSchedule(schedule));
};

export const getScheduleById = async (id: string): Promise<Schedule | undefined> => {
  const client = ensureClient();

  const scheduleResult = await client.models.Schedule.get(
    { id },
    {
      selectionSet: ["id", "title", "description", "candidates", "createdAt", "updatedAt"],
    },
  );

  const scheduleRecord = throwIfErrors(scheduleResult);
  if (!scheduleRecord) {
    return undefined;
  }

  const responsesResult = await client.models.ParticipantResponse.list({
    limit: 500,
    filter: {
      scheduleId: { eq: id },
    },
  });

  const responses = throwIfErrors(responsesResult) ?? [];
  const ordered = responses.sort(
    (a, b) =>
      new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() -
      new Date(a.updatedAt ?? a.createdAt ?? 0).getTime(),
  );

  return mapSchedule(scheduleRecord, ordered);
};

export const createSchedule = async (payload: CreateSchedulePayload): Promise<Schedule> => {
  const client = ensureClient();
  const normalized = ensureValidSchedulePayload(payload);
  const now = new Date().toISOString();

  const createResult = await client.models.Schedule.create({
    title: normalized.title,
    description: normalized.description,
    candidates: normalized.candidates,
    createdAt: now,
    updatedAt: now,
  });

  const schedule = throwIfErrors(createResult);
  if (!schedule) {
    throw new Error("Failed to create schedule");
  }

  const fullSchedule = await getScheduleById(schedule.id);
  if (!fullSchedule) {
    throw new Error("Created schedule but could not re-fetch it");
  }

  return fullSchedule;
};

export const upsertResponse = async (
  scheduleId: string,
  payload: ResponsePayload,
): Promise<Schedule> => {
  const client = ensureClient();
  const schedule = await getScheduleById(scheduleId);
  if (!schedule) {
    throw new Error("Schedule not found");
  }

  const name = payload.name?.trim();
  if (!name) {
    throw new Error("Participant name is required");
  }

  const normalizedName = name.toLowerCase();
  const answers = normalizeAnswers(schedule.candidates, payload.answers ?? {});
  const comment = payload.comment?.trim() || undefined;
  const now = new Date().toISOString();

  const lookup = await client.models.ParticipantResponse.list({
    limit: 1,
    filter: {
      scheduleId: { eq: scheduleId },
      normalizedName: { eq: normalizedName },
    },
  });

  const existing = throwIfErrors(lookup)?.[0];

  if (existing) {
    const updateResult = await client.models.ParticipantResponse.update({
      id: existing.id,
      scheduleId,
      name,
      normalizedName,
      comment,
      answers,
      updatedAt: now,
    });
    throwIfErrors(updateResult);
  } else {
    const createResult = await client.models.ParticipantResponse.create({
      scheduleId,
      name,
      normalizedName,
      comment,
      answers,
      createdAt: now,
      updatedAt: now,
    });
    throwIfErrors(createResult);
  }

  // Return the fresh schedule with responses.
  const updatedSchedule = await getScheduleById(scheduleId);
  if (!updatedSchedule) {
    throw new Error("Schedule disappeared after updating response");
  }

  return updatedSchedule;
};
