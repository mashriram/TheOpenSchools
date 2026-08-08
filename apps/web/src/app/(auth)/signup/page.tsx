"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, Label, TextField } from "@heroui/react";

interface ErrorBody {
  message?: string | string[];
}

function firstMessage(body: ErrorBody | null): string {
  if (!body?.message) {
    return "Signup failed. Please check your details and try again.";
  }
  return Array.isArray(body.message) ? body.message[0] : body.message;
}

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName: formData.get("schoolName"),
          subdomainSlug: formData.get("subdomainSlug"),
          adminEmail: formData.get("adminEmail"),
          adminPassword: formData.get("adminPassword"),
          adminFirstName: formData.get("adminFirstName"),
          adminSurname: formData.get("adminSurname"),
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
        <h1 className="text-2xl font-semibold">Create your school</h1>
      </Card.Header>
      <Card.Content>
        <Form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField name="schoolName" isRequired autoComplete="organization">
            <Label>School name</Label>
            <Input placeholder="Greenwood High" />
          </TextField>
          <TextField name="subdomainSlug" isRequired autoComplete="off">
            <Label>Subdomain</Label>
            <Input placeholder="greenwood-high" />
          </TextField>
          <TextField name="adminFirstName" isRequired autoComplete="given-name">
            <Label>Your first name</Label>
            <Input />
          </TextField>
          <TextField name="adminSurname" isRequired autoComplete="family-name">
            <Label>Your surname</Label>
            <Input />
          </TextField>
          <TextField name="adminEmail" type="email" isRequired autoComplete="email">
            <Label>Your email</Label>
            <Input />
          </TextField>
          <TextField
            name="adminPassword"
            type="password"
            isRequired
            autoComplete="new-password"
            minLength={10}
          >
            <Label>Password</Label>
            <Input />
          </TextField>
          {error ? (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="primary" isDisabled={isSubmitting}>
            {isSubmitting ? "Creating your school..." : "Create school"}
          </Button>
        </Form>
      </Card.Content>
    </Card>
  );
}
