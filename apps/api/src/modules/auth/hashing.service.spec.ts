import { HashingService } from './hashing.service';

describe('HashingService', () => {
  let service: HashingService;

  beforeEach(() => {
    service = new HashingService();
  });

  describe('password hashing', () => {
    it('verifies a correct password against its hash', async () => {
      const hash = await service.hashPassword('correct-password');

      expect(await service.verifyPassword(hash, 'correct-password')).toBe(true);
    });

    it('rejects an incorrect password', async () => {
      const hash = await service.hashPassword('correct-password');

      expect(await service.verifyPassword(hash, 'wrong-password')).toBe(false);
    });

    it('produces a different hash each time for the same password (random salt)', async () => {
      const hashA = await service.hashPassword('same-password');
      const hashB = await service.hashPassword('same-password');

      expect(hashA).not.toBe(hashB);
    });

    it('produces an argon2id hash', async () => {
      const hash = await service.hashPassword('correct-password');

      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('rejects an empty string password against a real hash', async () => {
      const hash = await service.hashPassword('correct-password');

      expect(await service.verifyPassword(hash, '')).toBe(false);
    });
  });

  describe('refresh token generation', () => {
    it('generates a 64-character hex token', () => {
      const token = service.generateRawToken();

      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('generates a different token on each call', () => {
      expect(service.generateRawToken()).not.toBe(service.generateRawToken());
    });

    it('hashes a token deterministically (same input -> same output)', () => {
      const token = service.generateRawToken();

      expect(service.hashToken(token)).toBe(service.hashToken(token));
    });

    it('produces a 64-character hex SHA-256 digest', () => {
      const token = service.generateRawToken();

      expect(service.hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
    });

    it('produces different hashes for different tokens', () => {
      const tokenA = service.generateRawToken();
      const tokenB = service.generateRawToken();

      expect(service.hashToken(tokenA)).not.toBe(service.hashToken(tokenB));
    });
  });
});
