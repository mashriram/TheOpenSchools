"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Form } from "@heroui/react";

export interface RosterPerson {
  id: string;
  firstName: string;
  surname: string;
}

export interface AttendanceCodeOption {
  id: string;
  name: string;
}

interface ErrorBody {
  message?: string | string[];
}

function firstMessage(body: ErrorBody | null): string {
  if (!body?.message) {
    return "Could not save the register. Please try again.";
  }
  return Array.isArray(body.message) ? body.message[0] : body.message;
}

/**
 * One <select> per roster row (native, same rationale as
 * CreateAlertForm) defaulting to the first code (normally "Present" -
 * Gibbon's own real UI defaults every student to present too, since most
 * days most students attend) - the teacher only needs to change the ones
 * that differ, matching the actual real-world register-taking workflow
 * this page is meant to prove out end-to-end.
 */
export function AttendanceRegisterForm({
  formGroupId,
  date,
  roster,
  codes,
}: {
  formGroupId: string;
  date: string;
  roster: RosterPerson[];
  codes: AttendanceCodeOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const entries = roster.map((person) => ({
      personId: person.id,
      attendanceCodeId: formData.get(`code-${person.id}`),
    }));

    try {
      const response = await fetch(
        `/api/attendance/form-groups/${formGroupId}/registers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, entries }),
        },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ErrorBody | null;
        setError(firstMessage(body));
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (roster.length === 0) {
    return <p className="text-default-500">This form group has no students.</p>;
  }
  if (codes.length === 0) {
    return (
      <p className="text-default-500">No attendance codes are configured yet.</p>
    );
  }

  return (
    <Form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <table className="w-full">
        <thead>
          <tr className="text-left">
            <th>Student</th>
            <th>Code</th>
          </tr>
        </thead>
        <tbody>
          {roster.map((person) => (
            <tr key={person.id}>
              <td className="py-1">
                {person.firstName} {person.surname}
              </td>
              <td className="py-1">
                <label className="sr-only" htmlFor={`code-${person.id}`}>
                  {person.firstName} {person.surname} attendance code
                </label>
                <select
                  id={`code-${person.id}`}
                  name={`code-${person.id}`}
                  defaultValue={codes[0]?.id}
                  className="rounded border border-default-200 p-1"
                >
                  {codes.map((code) => (
                    <option key={code.id} value={code.id}>
                      {code.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
      {success ? <p className="text-success text-sm">Register saved.</p> : null}
      <Button type="submit" variant="primary" isDisabled={isSubmitting} className="self-start">
        {isSubmitting ? "Saving..." : "Save register"}
      </Button>
    </Form>
  );
}
