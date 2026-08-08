"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, Label, TextField } from "@heroui/react";

interface ErrorBody {
  message?: string | string[];
}

function firstMessage(body: ErrorBody | null): string {
  if (!body?.message) {
    return "Login failed. Please check your details and try again.";
  }
  return Array.isArray(body.message) ? body.message[0] : body.message;
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolSlug: formData.get("schoolSlug"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ErrorBody | null;
        setError(firstMessage(body));
        return;
      }

      router.push("/people");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md p-8">
      <Card.Header>
        <h1 className="text-2xl font-semibold">Log in</h1>
      </Card.Header>
      <Card.Content>
        <Form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField name="schoolSlug" isRequired autoComplete="off">
            <Label>School</Label>
            <Input placeholder="greenwood-high" />
          </TextField>
          <TextField name="email" type="email" isRequired autoComplete="email">
            <Label>Email</Label>
            <Input />
          </TextField>
          <TextField name="password" type="password" isRequired autoComplete="current-password">
            <Label>Password</Label>
            <Input />
          </TextField>
          {error ? (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="primary" isDisabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>
        </Form>
      </Card.Content>
    </Card>
  );
}
