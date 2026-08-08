import {
  decryptField,
  encryptedColumnTransformer,
  encryptField,
} from './field-encryption';

const SECRET = 'a-test-secret-that-is-long-enough';

describe('encryptField / decryptField', () => {
  it('round-trips a plaintext value', () => {
    const encrypted = encryptField('Safeguarding note: contact DSL', SECRET);

    expect(decryptField(encrypted, SECRET)).toBe(
      'Safeguarding note: contact DSL',
    );
  });

  it('produces different ciphertext for the same plaintext each time (random IV)', () => {
    const first = encryptField('same input', SECRET);
    const second = encryptField('same input', SECRET);

    expect(first).not.toBe(second);
    expect(decryptField(first, SECRET)).toBe('same input');
    expect(decryptField(second, SECRET)).toBe('same input');
  });

  it('does not decrypt with the wrong secret', () => {
    const encrypted = encryptField('sensitive content', SECRET);

    expect(() => decryptField(encrypted, 'a-different-secret-value')).toThrow();
  });

  it('rejects a malformed encoded value', () => {
    expect(() => decryptField('not-a-real-encoded-value', SECRET)).toThrow(
      'Malformed encrypted field value',
    );
  });
});

describe('encryptedColumnTransformer', () => {
  const ORIGINAL_KEY = process.env.FIELD_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.FIELD_ENCRYPTION_KEY = SECRET;
  });

  afterEach(() => {
    process.env.FIELD_ENCRYPTION_KEY = ORIGINAL_KEY;
  });

  it('round-trips a value through to() then from()', () => {
    const stored = encryptedColumnTransformer.to('a behaviour comment') as
      string | null;
    expect(stored).not.toBe('a behaviour comment');

    expect(encryptedColumnTransformer.from(stored) as string | null).toBe(
      'a behaviour comment',
    );
  });

  it('passes null and undefined through unchanged in both directions', () => {
    expect(encryptedColumnTransformer.to(null)).toBeNull();
    expect(encryptedColumnTransformer.to(undefined)).toBeNull();
    expect(encryptedColumnTransformer.from(null)).toBeNull();
    expect(encryptedColumnTransformer.from(undefined)).toBeNull();
  });

  it('throws a clear error if FIELD_ENCRYPTION_KEY is missing when actually needed', () => {
    delete process.env.FIELD_ENCRYPTION_KEY;

    expect(() => {
      encryptedColumnTransformer.to('some value');
    }).toThrow('Missing required environment variable: FIELD_ENCRYPTION_KEY');
  });
});
