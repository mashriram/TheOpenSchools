import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In } from 'typeorm';
import { RolesRepository } from './repositories/roles.repository';
import { PermissionsRepository } from './repositories/permissions.repository';
import { ActionsRepository } from './repositories/actions.repository';
import { SchoolModuleEnablementsRepository } from './repositories/school-module-enablements.repository';
import { Action } from './entities/action.entity';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { isActionGrantable } from './seed/module-enablement';

@Injectable()
export class RbacService {
  constructor(
    private readonly roles: RolesRepository,
    private readonly permissions: PermissionsRepository,
    private readonly actions: ActionsRepository,
    private readonly schoolModuleEnablements: SchoolModuleEnablementsRepository,
  ) {}

  listRoles(schoolId: string): Promise<Role[]> {
    return this.roles.findBySchool(schoolId);
  }

  async createRole(schoolId: string, dto: CreateRoleDto): Promise<Role> {
    return this.roles.save(
      this.roles.create({
        schoolId,
        category: dto.category,
        name: dto.name,
        shortName: dto.shortName,
        description: dto.description,
        restriction: dto.restriction,
        type: 'Additional',
      }),
    );
  }

  async updateRole(
    schoolId: string,
    roleId: string,
    dto: UpdateRoleDto,
  ): Promise<Role> {
    const role = await this.getOwnedRole(schoolId, roleId);
    this.assertMutable(role);

    Object.assign(role, dto);
    return this.roles.save(role);
  }

  async deleteRole(schoolId: string, roleId: string): Promise<void> {
    const role = await this.getOwnedRole(schoolId, roleId);
    this.assertMutable(role);

    await this.roles.remove(role);
  }

  async getRolePermissionActionIds(
    schoolId: string,
    roleId: string,
  ): Promise<string[]> {
    await this.getOwnedRole(schoolId, roleId);
    const permissions = await this.permissions.findByRole(roleId);
    return permissions.map((p) => p.actionId);
  }

  /**
   * Bulk-set mirrors Gibbon's permission_manage_edit.php checkbox-grid save
   * in one call rather than one request per checkbox. Unlike role
   * create/update/delete, this is allowed on Core roles too - Gibbon lets
   * admins customize what a Core role (e.g. Teacher) can do; "Core" only
   * protects the role record itself, never its permission grants.
   */
  async setRolePermissions(
    schoolId: string,
    roleId: string,
    actionIds: string[],
  ): Promise<void> {
    await this.getOwnedRole(schoolId, roleId);

    if (actionIds.length > 0) {
      const foundActions = await this.actions.find({
        where: { id: In(actionIds) },
      });
      if (foundActions.length !== new Set(actionIds).size) {
        throw new BadRequestException('One or more actionIds do not exist');
      }
    }

    const existing = await this.permissions.findByRole(roleId);
    if (existing.length > 0) {
      await this.permissions.remove(existing);
    }

    if (actionIds.length > 0) {
      await this.permissions.save(
        actionIds.map((actionId) =>
          this.permissions.create({ roleId, actionId }),
        ),
      );
    }
  }

  /** Actions from modules that are both globally active and enabled for this school. */
  async listGrantableActions(schoolId: string): Promise<Action[]> {
    const allActions = await this.actions.find({ relations: { module: true } });
    const enabledModuleIds = new Set(
      await this.schoolModuleEnablements.findEnabledModuleIds(schoolId),
    );
    const activeModuleIds = new Set(
      allActions.filter((a) => a.module.active).map((a) => a.moduleId),
    );

    return allActions.filter((action) =>
      isActionGrantable(action, activeModuleIds, enabledModuleIds),
    );
  }

  private async getOwnedRole(schoolId: string, roleId: string): Promise<Role> {
    const role = await this.roles.findOne({ where: { id: roleId, schoolId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  private assertMutable(role: Role): void {
    if (role.type === 'Core') {
      throw new BadRequestException('Core roles cannot be modified or deleted');
    }
  }
}
