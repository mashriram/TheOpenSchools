import { computeConcern } from './markbook-concern';

describe('computeConcern', () => {
  describe('personal-target case', () => {
    it('flags Y when the entered grade is below the target', () => {
      expect(computeConcern({ value: 2 }, { value: 4 }, null)).toBe('Y');
    });

    it('flags P when the entered grade exceeds the target', () => {
      expect(computeConcern({ value: 5 }, { value: 4 }, null)).toBe('P');
    });

    it('flags N when the entered grade equals the target', () => {
      expect(computeConcern({ value: 4 }, { value: 4 }, null)).toBe('N');
    });

    it('prefers the personal target over a scale threshold when both are set', () => {
      expect(computeConcern({ value: 3 }, { value: 4 }, { value: 1 })).toBe(
        'Y',
      );
    });
  });

  describe('scale-threshold case', () => {
    it('flags Y when the entered grade is below the lowest-acceptable grade', () => {
      expect(computeConcern({ value: 1 }, null, { value: 2 })).toBe('Y');
    });

    it('flags N when the entered grade meets the lowest-acceptable grade', () => {
      expect(computeConcern({ value: 2 }, null, { value: 2 })).toBe('N');
    });

    it('flags N when the entered grade exceeds the lowest-acceptable grade', () => {
      expect(computeConcern({ value: 5 }, null, { value: 2 })).toBe('N');
    });
  });

  describe('no-warning case', () => {
    it('flags N when neither a target nor a threshold is configured', () => {
      expect(computeConcern({ value: 1 }, null, null)).toBe('N');
    });
  });
});
