"use client";

import { FormEvent, useMemo, useState } from "react";

interface ScheduleResponse {
  id: string;
}

const toDateTimeLocalValue = (date: Date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const defaultCandidates = [
  toDateTimeLocalValue(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  toDateTimeLocalValue(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
];

const asCandidateList = (candidates: string[]) =>
  candidates.length > 0 ? candidates : [""];

export default function CreateScheduleForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [candidates, setCandidates] = useState<string[]>([
    ...defaultCandidates,
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const isSubmitDisabled = useMemo(() => {
    return (
      !title.trim() ||
      candidates.filter((candidate) => candidate.trim().length > 0).length === 0
    );
  }, [title, candidates]);

  const updateCandidate = (index: number, value: string) => {
    setCandidates((prev) => {
      const next = [...prev];
      next[index] = value;
      return asCandidateList(next);
    });
  };

  const addCandidate = () => {
    setCandidates((prev) => [...prev, ""]);
  };

  const removeCandidate = (index: number) => {
    setCandidates((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return asCandidateList(next);
    });
  };

  const submitSchedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setShareLink(null);
    setIsSubmitting(true);

    try {
      const payload = {
        title,
        description,
        candidates: candidates
          .map((candidate) => candidate.trim())
          .filter(Boolean),
      };

      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as ScheduleResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create schedule");
      }

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      setShareLink(`${origin}/schedule/${data.id}`);
      setTitle("");
      setDescription("");
      setCandidates([...defaultCandidates]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create schedule";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!shareLink || typeof navigator === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareLink);
      setError(null);
    } catch {
      setError("Unable to copy the link automatically");
    }
  };

  return (
    <section className="panel">
      <h2>Create a schedule</h2>
      <p className="muted">
        Define the options once and share the link with anyone who needs to
        respond. No login required.
      </p>
      <form className="form" onSubmit={submitSchedule}>
        <label>
          <span>Schedule title</span>
          <input
            type="text"
            value={title}
            placeholder="Team sync for November"
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>

        <label>
          <span>Description</span>
          <textarea
            value={description}
            placeholder="Let's pick the best slot for our next catch up."
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </label>

        <div>
          <div className="label-row">
            <span>Candidate date & time</span>
            <button
              type="button"
              onClick={addCandidate}
              className="text-button"
            >
              + Add option
            </button>
          </div>
          <div className="candidate-list">
            {candidates.map((candidate, index) => (
              <div className="candidate-row" key={`${candidate}-${index}`}>
                <input
                  type="datetime-local"
                  value={candidate}
                  onChange={(event) =>
                    updateCandidate(index, event.target.value)
                  }
                  required={candidates.length === 1}
                />
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => removeCandidate(index)}
                  disabled={candidates.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={isSubmitting || isSubmitDisabled}>
          {isSubmitting ? "Creating..." : "Create schedule"}
        </button>
      </form>

      {shareLink && (
        <div className="share-card">
          <p>Your schedule is ready. Share this link with participants:</p>
          <code>{shareLink}</code>
          <div className="share-actions">
            <a href={shareLink} target="_blank" rel="noreferrer">
              Open schedule
            </a>
            <button type="button" className="ghost-button" onClick={copyLink}>
              Copy link
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
