import { redactSensitiveFields } from './redact-sensitive-fields';

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
});
