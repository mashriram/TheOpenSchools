import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { AttendanceCodesRepository } from './repositories/attendance-codes.repository';
import { AttendanceCodeRolesRepository } from './repositories/attendance-code-roles.repository';
import { AttendanceCode } from './entities/attendance-code.entity';
import { CreateAttendanceCodeDto } from './dto/create-attendance-code.dto';
import { UpdateAttendanceCodeDto } from './dto/update-attendance-code.dto';

@Injectable()
export class AttendanceCodesService {
  constructor(
    private readonly codes: AttendanceCodesRepository,
    private readonly codeRoles: AttendanceCodeRolesRepository,
  ) {}

  list(schoolId: string): Promise<AttendanceCode[]> {
    return this.codes.findBySchool(schoolId);
  }

  async create(
    schoolId: string,
    dto: CreateAttendanceCodeDto,
  ): Promise<AttendanceCode> {
    try {
      return await this.codes.save(
        this.codes.create({
          schoolId,
          name: dto.name,
          shortName: dto.shortName,
          type: dto.type ?? 'Additional',
          direction: dto.direction,
          scope: dto.scope,
          active: dto.active ?? true,
          reportable: dto.reportable ?? true,
          allowFutureDate: dto.allowFutureDate ?? false,
          prefill: dto.prefill ?? true,
          sequenceNumber: dto.sequenceNumber ?? 0,
        }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `An attendance code with short name "${dto.shortName}" already exists for this school`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateAttendanceCodeDto,
  ): Promise<AttendanceCode> {
    const code = await this.getOwned(schoolId, id);
    Object.assign(code, dto);

    try {
      return await this.codes.save(code);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `An attendance code with short name "${code.shortName}" already exists for this school`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const code = await this.getOwned(schoolId, id);
    await this.codes.softRemove(code);
  }

  async setRestrictedRoles(
    schoolId: string,
    id: string,
    roleIds: string[],
  ): Promise<void> {
    await this.getOwned(schoolId, id);
    await this.codeRoles.delete({ attendanceCodeId: id });
    if (roleIds.length > 0) {
      await this.codeRoles.save(
        roleIds.map((roleId) =>
          this.codeRoles.create({ attendanceCodeId: id, roleId }),
        ),
      );
    }
  }

  listRestrictedRoleIds(codeId: string): Promise<string[]> {
    return this.codeRoles
      .findByCode(codeId)
      .then((rows) => rows.map((row) => row.roleId));
  }

  /** Also used by AttendanceRegisterService to authorize an AttendanceCode id. */
  async getOwned(schoolId: string, id: string): Promise<AttendanceCode> {
    const code = await this.codes.findByIdAndSchool(id, schoolId);
    if (!code) {
      throw new NotFoundException('Attendance code not found');
    }
    return code;
  }
}
