"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Form } from "@heroui/react";

export interface AlertTypeOption {
  id: string;
  name: string;
}

interface ErrorBody {
  message?: string | string[];
}

function firstMessage(body: ErrorBody | null): string {
  if (!body?.message) {
    return "Could not create the alert. Please try again.";
  }
  return Array.isArray(body.message) ? body.message[0] : body.message;
}

/**
 * Uses plain native <select>/<textarea> rather than HeroUI's Select/TextArea:
 * HeroUI v3's Select is a compound react-aria API with no simple "list of
 * options" shape (no SelectItem export, needs its own Collection wiring),
 * and this is a one-off form field, not a pattern worth adopting a new
 * unfamiliar API for - matching this codebase's existing "avoid
 * overbuilding" bias.
 */
export function CreateAlertForm({
  personId,
  schoolYearId,
  alertTypes,
}: {
  personId: string;
  schoolYearId: string;
  alertTypes: AlertTypeOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Captured before the `await` below: React nulls out `event.currentTarget`
    // once the synchronous part of the handler returns, even without event
    // pooling - reading it after an await throws (caught below, silently
    // swallowing the real error and skipping router.refresh() entirely).
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/student-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolYearId,
          personId,
          alertTypeId: formData.get("alertTypeId"),
          comment: formData.get("comment") || undefined,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ErrorBody | null;
        setError(firstMessage(body));
        return;
      }

      form.reset();
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <label className="flex flex-col gap-1">
        <span>Alert type</span>
        <select name="alertTypeId" required className="rounded border border-default-200 p-2">
          {alertTypes.map((alertType) => (
            <option key={alertType.id} value={alertType.id}>
              {alertType.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span>Comment</span>
        <textarea name="comment" className="rounded border border-default-200 p-2" />
      </label>
      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" isDisabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Add alert"}
      </Button>
    </Form>
  );
}
