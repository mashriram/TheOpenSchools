export interface Person {
  id: string;
  surname: string;
  firstName: string;
  email: string | null;
}

/**
 * Split out from page.tsx as a plain presentational component so its
 * loading/empty/data states are directly RTL-testable without needing to
 * mock next/headers or next/navigation - the page itself is a thin async
 * wrapper that only does auth + fetch orchestration.
 */
export function PeopleList({ people }: { people: Person[] }) {
  if (people.length === 0) {
    return <p className="text-default-500">No one has been added yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {people.map((person) => (
        <li key={person.id} className="rounded border border-default-200 p-3">
          {person.firstName} {person.surname}
          {person.email ? ` — ${person.email}` : null}
        </li>
      ))}
    </ul>
  );
}
