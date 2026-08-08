import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';
import type { ValueTransformer } from 'typeorm';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const KEY_DERIVATION_SALT = 'purpleschools-field-encryption-v1';

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, KEY_DERIVATION_SALT, 32);
}

/**
 * AES-256-GCM for Tier C column-level encryption (see plan §Data Safety
 * Design A/D - Alert.comment, IndividualNeed.notes/strategies/targets,
 * Behaviour.comment/followup). Deliberately Node's built-in `crypto` rather
 * than a third-party package like `typeorm-encrypted`: Foundation already
 * flagged native-binding dependencies (argon2) as a real build risk to
 * watch, and this sidesteps that risk class entirely while keeping full
 * control over the transformer's behavior instead of trusting a
 * lightly-maintained wrapper's TypeORM-diffing behavior.
 */
export function encryptField(plaintext: string, secret: string): string {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, deriveKey(secret), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext]
    .map((buf) => buf.toString('base64'))
    .join(':');
}

export function decryptField(encoded: string, secret: string): string {
  const [ivB64, authTagB64, ciphertextB64] = encoded.split(':');
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error('Malformed encrypted field value');
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    deriveKey(secret),
    Buffer.from(ivB64, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

function requiredEncryptionSecret(): string {
  const secret = process.env.FIELD_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      'Missing required environment variable: FIELD_ENCRYPTION_KEY',
    );
  }
  return secret;
}

/**
 * TypeORM ValueTransformer for Tier C entity columns. Reads the encryption
 * secret from process.env lazily, at call time rather than at module-load/
 * decoration time - entity classes are imported (and their @Column
 * decorators evaluated) before Nest's ConfigModule necessarily finishes
 * loading .env in every startup path (CLI scripts, migrations), so this
 * can't use the getRequiredEnv(config, key)/ConfigService pattern the rest
 * of the app uses - that requires a DI container that doesn't exist yet at
 * decoration time. This is the one deliberate exception to that convention.
 */
export const encryptedColumnTransformer: ValueTransformer = {
  to: (value: string | null | undefined): string | null =>
    value == null ? null : encryptField(value, requiredEncryptionSecret()),
  from: (value: string | null | undefined): string | null =>
    value == null ? null : decryptField(value, requiredEncryptionSecret()),
};
