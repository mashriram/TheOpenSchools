"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

export interface MarkbookEntryRow {
  personId: string;
  attainmentScaleGradeId: string | null;
  attainmentScaleGrade: { shortName: string } | null;
  effortScaleGradeId: string | null;
  effortScaleGrade: { shortName: string } | null;
  comment: string | null;
}

interface ErrorBody {
  message?: string | string[];
}

function firstMessage(body: ErrorBody | null): string {
  if (!body?.message) {
    return "Could not save this entry. Please try again.";
  }
  return Array.isArray(body.message) ? body.message[0] : body.message;
}

/**
 * Grade values are entered as raw ScaleGrade ids (a plain text input, not a
 * picker bound to the column's own Scale) - a deliberate MVP simplification:
 * there is no existing "get a single MarkbookColumn" endpoint to resolve
 * which Scale a column uses, and building one just to power a dropdown here
 * would be scope creep for a page whose real purpose (per the plan) is
 * proving the column-level visibility gate end-to-end, not full grade-entry
 * UX. Proves: a teacher/admin can write attainment/effort/comment per
 * student, one row at a time, matching the API's own per-entry upsert shape.
 *
 * Each row is a plain button + controlled inputs, not a <form>: a <form>
 * cannot be a valid child of <tr>, and one <form> around the whole table
 * would submit every row's values together instead of independently.
 */
export function MarkbookRoster({
  columnId,
  entries,
}: {
  columnId: string;
  entries: MarkbookEntryRow[];
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="text-left">
          <th>Student</th>
          <th>Attainment</th>
          <th>Effort</th>
          <th>Comment</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <MarkbookEntryRowForm key={entry.personId} columnId={columnId} entry={entry} />
        ))}
      </tbody>
    </table>
  );
}

function MarkbookEntryRowForm({
  columnId,
  entry,
}: {
  columnId: string;
  entry: MarkbookEntryRow;
}) {
  const router = useRouter();
  const [attainment, setAttainment] = useState(entry.attainmentScaleGradeId ?? "");
  const [effort, setEffort] = useState(entry.effortScaleGradeId ?? "");
  const [comment, setComment] = useState(entry.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/markbook/columns/${columnId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: entry.personId,
          attainmentScaleGradeId: attainment || undefined,
          effortScaleGradeId: effort || undefined,
          comment: comment || undefined,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ErrorBody | null;
        setError(firstMessage(body));
        return;
      }

      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <tr>
      <td className="py-1 font-mono text-xs">{entry.personId}</td>
      <td className="py-1">
        <input
          aria-label={`Attainment grade for ${entry.personId}`}
          value={attainment}
          onChange={(event) => setAttainment(event.target.value)}
          placeholder={entry.attainmentScaleGrade?.shortName ?? "grade id"}
          className="w-24 rounded border border-default-200 p-1"
        />
      </td>
      <td className="py-1">
        <input
          aria-label={`Effort grade for ${entry.personId}`}
          value={effort}
          onChange={(event) => setEffort(event.target.value)}
          placeholder={entry.effortScaleGrade?.shortName ?? "grade id"}
          className="w-24 rounded border border-default-200 p-1"
        />
      </td>
      <td className="py-1">
        <input
          aria-label={`Comment for ${entry.personId}`}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="w-full rounded border border-default-200 p-1"
        />
      </td>
      <td className="py-1">
        <Button onPress={handleSave} isDisabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
        {error ? (
          <span role="alert" className="ml-2 text-danger text-xs">
            {error}
          </span>
        ) : null}
      </td>
    </tr>
  );
}
