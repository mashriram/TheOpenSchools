import { ConfigService } from '@nestjs/config';

/**
 * Fails fast at boot (JwtStrategy's constructor, AuthService's constructor)
 * rather than silently signing/verifying every access token with a
 * hardcoded fallback secret if the real one is ever missing from the
 * environment - the previous `config.get(key, 'change-me')` pattern would
 * let anyone forge a token with an arbitrary schoolId/activeRoleId if that
 * env var were ever unset in a real deployment.
 */
export function getRequiredEnv(config: ConfigService, key: string): string {
  const value = config.get<string>(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
