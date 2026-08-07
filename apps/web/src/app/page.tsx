import { Button, Card } from "@heroui/react";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="max-w-md p-8">
        <Card.Header>
          <h1 className="text-2xl font-semibold">PurpleSchools</h1>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <p className="text-default-500">
            Next.js + HeroUI frontend scaffold is wired up.
          </p>
          <Button variant="primary">It works</Button>
        </Card.Content>
      </Card>
    </div>
  );
}
