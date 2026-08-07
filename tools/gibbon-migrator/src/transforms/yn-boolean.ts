/**
 * Gibbon uses enum('Y','N') as a boolean substitute across ~355 columns.
 * TypeORM's native enum-migration support has long-standing bugs on both
 * MySQL and Postgres, so these become real BOOLEAN columns in the new schema.
 */
export function ynToBoolean(value: string | null | undefined): boolean | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalized = value.toUpperCase();

  if (normalized === "Y") {
    return true;
  }

  if (normalized === "N") {
    return false;
  }

  throw new Error(`"${value}" is not a valid Y/N value, expected 'Y' or 'N'`);
}
