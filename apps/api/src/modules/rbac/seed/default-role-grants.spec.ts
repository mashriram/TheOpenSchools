import { getDefaultActionsForSlot } from './default-role-grants';
import { Action } from '../entities/action.entity';

function fixtureAction(name: string, overrides: Partial<Action> = {}): Action {
  return {
    id: name,
    name,
    defaultPermissionAdmin: false,
    defaultPermissionTeacher: false,
    defaultPermissionStudent: false,
    defaultPermissionParent: false,
    defaultPermissionSupport: false,
    ...overrides,
  } as Action;
}

describe('getDefaultActionsForSlot', () => {
  const adminOnly = fixtureAction('admin.only', {
    defaultPermissionAdmin: true,
  });
  const teacherOnly = fixtureAction('teacher.only', {
    defaultPermissionTeacher: true,
  });
  const studentOnly = fixtureAction('student.only', {
    defaultPermissionStudent: true,
  });
  const parentOnly = fixtureAction('parent.only', {
    defaultPermissionParent: true,
  });
  const supportOnly = fixtureAction('support.only', {
    defaultPermissionSupport: true,
  });
  const grantedToNoOne = fixtureAction('granted.to.no.one');
  const grantedToAdminAndTeacher = fixtureAction('shared.action', {
    defaultPermissionAdmin: true,
    defaultPermissionTeacher: true,
  });

  const allActions = [
    adminOnly,
    teacherOnly,
    studentOnly,
    parentOnly,
    supportOnly,
    grantedToNoOne,
    grantedToAdminAndTeacher,
  ];

  it('returns only actions with defaultPermissionAdmin for the Admin slot', () => {
    const result = getDefaultActionsForSlot('Admin', allActions);

    expect(result.map((a) => a.name)).toEqual(['admin.only', 'shared.action']);
  });

  it('returns only actions with defaultPermissionTeacher for the Teacher slot', () => {
    const result = getDefaultActionsForSlot('Teacher', allActions);

    expect(result.map((a) => a.name)).toEqual([
      'teacher.only',
      'shared.action',
    ]);
  });

  it('returns only actions with defaultPermissionStudent for the Student slot', () => {
    const result = getDefaultActionsForSlot('Student', allActions);

    expect(result.map((a) => a.name)).toEqual(['student.only']);
  });

  it('returns only actions with defaultPermissionParent for the Parent slot', () => {
    const result = getDefaultActionsForSlot('Parent', allActions);

    expect(result.map((a) => a.name)).toEqual(['parent.only']);
  });

  it('returns only actions with defaultPermissionSupport for the Support slot', () => {
    const result = getDefaultActionsForSlot('Support', allActions);

    expect(result.map((a) => a.name)).toEqual(['support.only']);
  });

  it('excludes an action granted to no slot from every slot', () => {
    for (const slot of [
      'Admin',
      'Teacher',
      'Student',
      'Parent',
      'Support',
    ] as const) {
      expect(
        getDefaultActionsForSlot(slot, allActions).map((a) => a.name),
      ).not.toContain('granted.to.no.one');
    }
  });

  it('returns an empty array when given no actions', () => {
    expect(getDefaultActionsForSlot('Admin', [])).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const snapshot = [...allActions];

    getDefaultActionsForSlot('Admin', allActions);

    expect(allActions).toEqual(snapshot);
  });
});
