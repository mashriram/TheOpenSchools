import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { DepartmentsRepository } from './repositories/departments.repository';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly departments: DepartmentsRepository) {}

  list(schoolId: string): Promise<Department[]> {
    return this.departments.findBySchool(schoolId);
  }

  async create(
    schoolId: string,
    dto: CreateDepartmentDto,
  ): Promise<Department> {
    try {
      return await this.departments.save(
        this.departments.create({ schoolId, sequenceNumber: 0, ...dto }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A department named "${dto.name}" already exists at this school`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateDepartmentDto,
  ): Promise<Department> {
    const department = await this.getOwned(schoolId, id);
    Object.assign(department, dto);
    try {
      return await this.departments.save(department);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A department named "${department.name}" already exists at this school`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const department = await this.getOwned(schoolId, id);
    await this.departments.softRemove(department);
  }

  private async getOwned(schoolId: string, id: string): Promise<Department> {
    const department = await this.departments.findOne({
      where: { id, schoolId },
    });
    if (!department) {
      throw new NotFoundException('Department not found');
    }
    return department;
  }
}
