/**
 * Gibbon declares almost every id column as `int UNSIGNED ZEROFILL`, which
 * pads the displayed/exported value with leading zeros (e.g. "00000042").
 * ZEROFILL has no Postgres equivalent and is display-only in MySQL itself,
 * so every id must be normalized to a plain integer during migration.
 */
export function stripZerofill(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }

  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`"${value}" is not a valid zerofilled integer`);
  }

  return Number.parseInt(trimmed, 10);
}
