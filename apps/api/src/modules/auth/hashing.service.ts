import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';

/**
 * argon2id, not Gibbon's `PasswordVerifier('sha256')` (already flagged in
 * the plan as a nonstandard argument worth re-verifying). argon2's output
 * embeds its own salt, so there's no separate salt column to manage.
 */
@Injectable()
export class HashingService {
  hashPassword(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword, { type: argon2.argon2id });
  }

  verifyPassword(hash: string, plainPassword: string): Promise<boolean> {
    return argon2.verify(hash, plainPassword);
  }

  /**
   * Refresh tokens are high-entropy random values already, so a fast
   * deterministic hash (not argon2's deliberately-slow one) is the right
   * tool here - it just needs to keep the raw token unusable if the DB
   * leaks, not resist brute-forcing a low-entropy secret.
   */
  generateRawToken(): string {
    return randomBytes(32).toString('hex');
  }

  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
