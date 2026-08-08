import {
  redactSensitiveFields,
  SENSITIVE_FIELDS_BY_ENTITY,
} from './redact-sensitive-fields';

describe('redactSensitiveFields', () => {
  it('returns null for null or undefined input', () => {
    expect(redactSensitiveFields(null)).toBeNull();
    expect(redactSensitiveFields(undefined)).toBeNull();
  });

  it('leaves non-sensitive fields untouched', () => {
    const result = redactSensitiveFields({ surname: 'Smith', firstName: 'Jo' });

    expect(result).toEqual({ surname: 'Smith', firstName: 'Jo' });
  });

  it.each(['passwordHash', 'mfaSecret', 'tokenHash', 'refreshToken'])(
    'redacts %s to a fixed marker, not the real value',
    (field) => {
      const result = redactSensitiveFields({ [field]: 'super-secret-value' });

      expect(result).toEqual({ [field]: '[REDACTED]' });
    },
  );

  it('redacts only sensitive fields in a mixed object', () => {
    const result = redactSensitiveFields({
      username: 'jo@example.com',
      passwordHash: 'argon2id$...',
      failedLoginCount: 0,
    });

    expect(result).toEqual({
      username: 'jo@example.com',
      passwordHash: '[REDACTED]',
      failedLoginCount: 0,
    });
  });

  describe('per-entity Tier B/C classification', () => {
    const ENTITY_NAME = '__TestSensitiveEntity__';

    afterEach(() => {
      delete SENSITIVE_FIELDS_BY_ENTITY[ENTITY_NAME];
    });

    it('omits an entity-classified "omit" field entirely, not just masks it', () => {
      SENSITIVE_FIELDS_BY_ENTITY[ENTITY_NAME] = { omit: new Set(['comment']) };

      const result = redactSensitiveFields(
        { id: '1', comment: 'a safeguarding note' },
        ENTITY_NAME,
      );

      expect(result).toEqual({ id: '1' });
      expect(result).not.toHaveProperty('comment');
    });

    it('passes an entity-classified "encrypt" field through the supplied encryptValue function', () => {
      SENSITIVE_FIELDS_BY_ENTITY[ENTITY_NAME] = { encrypt: new Set(['notes']) };
      const encryptValue = jest.fn((value: string) => `ENCRYPTED(${value})`);

      const result = redactSensitiveFields(
        { id: '1', notes: 'raw narrative' },
        ENTITY_NAME,
        encryptValue,
      );

      expect(encryptValue).toHaveBeenCalledWith('raw narrative');
      expect(result).toEqual({ id: '1', notes: 'ENCRYPTED(raw narrative)' });
    });

    it('leaves fields untouched for an entity with no classification registered', () => {
      const result = redactSensitiveFields(
        { id: '1', comment: 'ordinary comment' },
        'SomeUnclassifiedEntity',
      );

      expect(result).toEqual({ id: '1', comment: 'ordinary comment' });
    });

    it('throws rather than silently persisting plaintext when an encrypt field is present but no encryptValue is supplied', () => {
      SENSITIVE_FIELDS_BY_ENTITY[ENTITY_NAME] = { encrypt: new Set(['notes']) };

      expect(() =>
        redactSensitiveFields({ id: '1', notes: 'raw narrative' }, ENTITY_NAME),
      ).toThrow(/encryptValue function must be supplied/);
    });

    it('a global secret field is still masked even for a per-entity-classified entity', () => {
      SENSITIVE_FIELDS_BY_ENTITY[ENTITY_NAME] = { encrypt: new Set(['notes']) };

      const result = redactSensitiveFields(
        { id: '1', notes: 'raw', passwordHash: 'should-never-appear' },
        ENTITY_NAME,
        (value) => `ENCRYPTED(${value})`,
      );

      expect(result).toEqual({
        id: '1',
        notes: 'ENCRYPTED(raw)',
        passwordHash: '[REDACTED]',
      });
    });
  });
});
