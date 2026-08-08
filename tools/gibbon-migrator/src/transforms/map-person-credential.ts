import { randomBytes } from "node:crypto";
import { GibbonPersonRow } from "../gibbon-types";

export interface MappedPersonCredential {
  id: string;
  personId: string;
  schoolId: string;
  username: string;
  passwordHash: string;
  passwordForceReset: boolean;
  canLogin: boolean;
}

/**
 * Gibbon's password hash isn't reversible and can't be migrated (per the
 * plan's data-migration strategy) - every migrated account gets a
 * non-guessable placeholder hash and canLogin: false, not true-with-a-
 * forced-reset-flag, because no password-reset delivery mechanism exists
 * yet (an open item the plan already flagged for M7). An admin activates
 * these accounts (sends a reset email, sets canLogin: true) once that
 * mechanism exists - this is intentionally NOT a real argon2 hash, since
 * it's never meant to be verified against; canLogin: false is what
 * actually blocks login, checked before any password comparison happens.
 */
export function mapPersonCredential(
  row: GibbonPersonRow,
  id: string,
  personId: string,
  schoolId: string,
): MappedPersonCredential {
  const username = row.username?.trim() || row.email?.trim() || personId;

  return {
    id,
    personId,
    schoolId,
    username,
    passwordHash: `unmigrated:${randomBytes(32).toString("hex")}`,
    passwordForceReset: true,
    canLogin: false,
  };
}
