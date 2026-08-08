import { QueryFailedError } from 'typeorm';

const DUPLICATE_ENTRY_ERROR_CODE = 'ER_DUP_ENTRY';

/** True for a MySQL unique-index violation surfaced through TypeORM. */
export function isDuplicateEntryError(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string } | undefined)?.code ===
      DUPLICATE_ENTRY_ERROR_CODE
  );
}
