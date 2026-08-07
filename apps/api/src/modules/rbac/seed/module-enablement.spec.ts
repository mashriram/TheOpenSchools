import { filterGrantableActions, isActionGrantable } from './module-enablement';
import { Action } from '../entities/action.entity';
import { PlatformModule } from '../entities/platform-module.entity';

function fixtureModule(id: string, active: boolean): PlatformModule {
  return { id, active } as PlatformModule;
}

function fixtureAction(id: string, moduleId: string): Action {
  return { id, moduleId, name: id } as Action;
}

describe('isActionGrantable', () => {
  it('is grantable when the module is both globally active and enabled for the school', () => {
    const action = fixtureAction('a1', 'moduleA');

    expect(
      isActionGrantable(action, new Set(['moduleA']), new Set(['moduleA'])),
    ).toBe(true);
  });

  it('is not grantable when the module is globally inactive, even if enabled for the school', () => {
    const action = fixtureAction('a1', 'moduleA');

    expect(isActionGrantable(action, new Set(), new Set(['moduleA']))).toBe(
      false,
    );
  });

  it('is not grantable when the module is active but disabled for the school', () => {
    const action = fixtureAction('a1', 'moduleA');

    expect(isActionGrantable(action, new Set(['moduleA']), new Set())).toBe(
      false,
    );
  });

  it('is not grantable when neither set contains the module', () => {
    const action = fixtureAction('a1', 'moduleA');

    expect(isActionGrantable(action, new Set(), new Set())).toBe(false);
  });
});

describe('filterGrantableActions', () => {
  it('keeps actions from active modules that are enabled for the school', () => {
    const modules = [
      fixtureModule('moduleA', true),
      fixtureModule('moduleB', true),
    ];
    const actions = [
      fixtureAction('a1', 'moduleA'),
      fixtureAction('a2', 'moduleB'),
    ];

    const result = filterGrantableActions(
      actions,
      modules,
      new Set(['moduleA', 'moduleB']),
    );

    expect(result.map((a) => a.id)).toEqual(['a1', 'a2']);
  });

  it('drops actions belonging to a globally inactive module', () => {
    const modules = [fixtureModule('moduleA', false)];
    const actions = [fixtureAction('a1', 'moduleA')];

    const result = filterGrantableActions(
      actions,
      modules,
      new Set(['moduleA']),
    );

    expect(result).toEqual([]);
  });

  it('drops actions belonging to a module not enabled for this school', () => {
    const modules = [fixtureModule('moduleA', true)];
    const actions = [fixtureAction('a1', 'moduleA')];

    const result = filterGrantableActions(actions, modules, new Set());

    expect(result).toEqual([]);
  });

  it('returns an empty array when there are no actions', () => {
    const modules = [fixtureModule('moduleA', true)];

    expect(filterGrantableActions([], modules, new Set(['moduleA']))).toEqual(
      [],
    );
  });
});
