import { buildErasureFields } from './build-erasure-fields';

describe('buildErasureFields', () => {
  it('nulls every PII field it targets', () => {
    const fields = buildErasureFields();

    expect(fields.surname).toBe('[ERASED]');
    expect(fields.firstName).toBe('[ERASED]');
    expect(fields.email).toBeNull();
    expect(fields.dateOfBirth).toBeNull();
    expect(fields.address1).toBeNull();
  });

  it('does not touch fields outside its target list (e.g. schoolId, houseId)', () => {
    const fields = buildErasureFields();

    expect(fields).not.toHaveProperty('schoolId');
    expect(fields).not.toHaveProperty('houseId');
    expect(fields).not.toHaveProperty('id');
  });
});
