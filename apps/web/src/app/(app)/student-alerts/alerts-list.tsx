export interface AlertRow {
  id: string;
  level: string | null;
  dateStart: string | null;
  comment: string | null;
  alertType: {
    name: string;
    adminOnly: boolean;
  };
}

/**
 * Split out as a plain presentational component, same rationale as
 * PeopleList. Deliberately renders `comment` when present: this list is
 * fed by the full-detail `GET /student-alerts/people/:personId` endpoint
 * (gated by the Tier C row-level CASL check in AlertsService), not the
 * Tier-C-safe AlertBadgeDto summary - see this page's own doc comment for
 * why demonstrating that gate matters more here than in most other pages.
 */
export function AlertsList({ alerts }: { alerts: AlertRow[] }) {
  if (alerts.length === 0) {
    return <p className="text-default-500">No alerts recorded for this person.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {alerts.map((alert) => (
        <li key={alert.id} className="rounded border border-default-200 p-3">
          <div className="font-medium">
            {alert.alertType.name}
            {alert.alertType.adminOnly ? (
              <span className="ml-2 text-xs text-danger">Admin only</span>
            ) : null}
            {alert.level ? <span className="ml-2 text-xs">({alert.level})</span> : null}
          </div>
          {alert.dateStart ? (
            <div className="text-sm text-default-500">{alert.dateStart}</div>
          ) : null}
          {alert.comment ? <p className="mt-1">{alert.comment}</p> : null}
        </li>
      ))}
    </ul>
  );
}
