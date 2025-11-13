"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AVAILABILITY_SYMBOL,
  Availability,
  ResponsePayload,
  Schedule,
} from "@/lib/types";

const availabilityOptions: { value: Availability; label: string; helper: string }[] =
  [
    { value: "available", label: "◯", helper: "Available" },
    { value: "maybe", label: "△", helper: "Maybe" },
    { value: "unavailable", label: "✕", helper: "Not available" },
  ];

const buildDefaultAnswers = (candidates: string[]) =>
  candidates.reduce<Record<string, Availability>>((acc, candidate) => {
    acc[candidate] = "available";
    return acc;
  }, {});

const formatCandidate = (candidate: string) => {
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) {
    return candidate;
  }

  return parsed.toLocaleString();
};

interface ScheduleClientProps {
  initialSchedule: Schedule;
}

export default function ScheduleClient({ initialSchedule }: ScheduleClientProps) {
  const [schedule, setSchedule] = useState<Schedule>(initialSchedule);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [answers, setAnswers] = useState<Record<string, Availability>>(
    buildDefaultAnswers(initialSchedule.candidates),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [statusKind, setStatusKind] = useState<"success" | "error">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderedResponses = useMemo(() => {
    return [...schedule.responses].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [schedule.responses]);

  const scheduleId = initialSchedule.id;

  const refreshSchedule = useCallback(async () => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to refresh schedule");
      }

      const data = (await response.json()) as Schedule;
      setSchedule(data);
    } catch (error) {
      console.error(error);
    }
  }, [scheduleId]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshSchedule();
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshSchedule]);

  useEffect(() => {
    setAnswers((prev) => {
      const next: Record<string, Availability> = {};
      schedule.candidates.forEach((candidate) => {
        next[candidate] = prev[candidate] ?? "available";
      });
      return next;
    });
  }, [schedule.candidates]);

  const updateAnswer = (candidate: string, value: Availability) => {
    setAnswers((prev) => ({ ...prev, [candidate]: value }));
  };

  const submitResponse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const payload: ResponsePayload = {
      name,
      comment,
      answers,
    };

    try {
      const response = await fetch(`/api/schedules/${scheduleId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to submit response");
      }

      const updatedSchedule = data as Schedule;
      setSchedule(updatedSchedule);
      setStatus("Response saved. Feel free to update it anytime.");
      setStatusKind("success");
      setName("");
      setComment("");
      setAnswers(buildDefaultAnswers(updatedSchedule.candidates));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit response";
      setStatus(message);
      setStatusKind("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="schedule-view">
      <section className="panel">
        <h1>{schedule.title}</h1>
        {schedule.description && (
          <p className="muted">{schedule.description}</p>
        )}
        <p className="muted small">
          {schedule.candidates.length} option
          {schedule.candidates.length === 1 ? "" : "s"} ·{" "}
          {schedule.responses.length} response
          {schedule.responses.length === 1 ? "" : "s"}
        </p>
      </section>

      <section className="panel">
        <div className="label-row">
          <h2>Responses</h2>
          <button type="button" className="text-button" onClick={refreshSchedule}>
            Refresh
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Participant</th>
                {schedule.candidates.map((candidate) => (
                  <th key={candidate}>{formatCandidate(candidate)}</th>
                ))}
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {orderedResponses.length === 0 && (
                <tr>
                  <td colSpan={schedule.candidates.length + 2}>
                    Nobody has responded yet.
                  </td>
                </tr>
              )}
              {orderedResponses.map((response) => (
                <tr key={response.id}>
                  <td>
                    <div className="participant-cell">
                      <strong>{response.name}</strong>
                      <span className="muted small">
                        Updated {new Date(response.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </td>
                  {schedule.candidates.map((candidate) => (
                    <td key={`${response.id}-${candidate}`}>
                      {AVAILABILITY_SYMBOL[response.answers[candidate]] ?? "?"}
                    </td>
                  ))}
                  <td>{response.comment ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Add / update your answer</h2>
        <form className="form" onSubmit={submitResponse}>
          <label>
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              required
            />
          </label>

          <div className="candidate-grid">
            {schedule.candidates.map((candidate) => (
              <div className="candidate-choice" key={candidate}>
                <p className="muted small">{formatCandidate(candidate)}</p>
                <div className="choice-row">
                  {availabilityOptions.map((option) => (
                    <label
                      key={option.value}
                      className={
                        answers[candidate] === option.value ? "choice active" : "choice"
                      }
                    >
                      <input
                        type="radio"
                        name={`choice-${candidate}`}
                        value={option.value}
                        checked={answers[candidate] === option.value}
                        onChange={() => updateAnswer(candidate, option.value)}
                      />
                      <span>{option.label}</span>
                      <span className="muted small">{option.helper}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <label>
            <span>Comment (optional)</span>
            <textarea
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Anything others should know?"
            />
          </label>

          {status && (
            <p className={statusKind === "error" ? "error" : "success"}>
              {status}
            </p>
          )}

          <button type="submit" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? "Saving..." : "Submit response"}
          </button>
        </form>
      </section>
    </div>
  );
}
