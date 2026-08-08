import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { TimetableColumnsRepository } from './repositories/timetable-columns.repository';
import { TimetableColumnRowsRepository } from './repositories/timetable-column-rows.repository';
import { TimetableColumn } from './entities/timetable-column.entity';
import { TimetableColumnRow } from './entities/timetable-column-row.entity';
import { CreateTimetableColumnDto } from './dto/create-timetable-column.dto';
import { UpdateTimetableColumnDto } from './dto/update-timetable-column.dto';
import { CreateTimetableColumnRowDto } from './dto/create-timetable-column-row.dto';
import { UpdateTimetableColumnRowDto } from './dto/update-timetable-column-row.dto';

@Injectable()
export class TimetableColumnsService {
  constructor(
    private readonly columns: TimetableColumnsRepository,
    private readonly rows: TimetableColumnRowsRepository,
  ) {}

  list(schoolId: string): Promise<TimetableColumn[]> {
    return this.columns.findBySchool(schoolId);
  }

  async create(
    schoolId: string,
    dto: CreateTimetableColumnDto,
  ): Promise<TimetableColumn> {
    try {
      return await this.columns.save(this.columns.create({ schoolId, ...dto }));
    } catch (error) {
      throw this.duplicateOr(error, dto.shortName);
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateTimetableColumnDto,
  ): Promise<TimetableColumn> {
    const column = await this.getOwned(schoolId, id);
    Object.assign(column, dto);
    try {
      return await this.columns.save(column);
    } catch (error) {
      throw this.duplicateOr(error, column.shortName);
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const column = await this.getOwned(schoolId, id);
    await this.columns.softRemove(column);
  }

  async getOwned(schoolId: string, id: string): Promise<TimetableColumn> {
    const column = await this.columns.findByIdAndSchool(id, schoolId);
    if (!column) {
      throw new NotFoundException('Timetable column not found');
    }
    return column;
  }

  listRows(timetableColumnId: string): Promise<TimetableColumnRow[]> {
    return this.rows.findByColumn(timetableColumnId);
  }

  async addRow(
    schoolId: string,
    timetableColumnId: string,
    dto: CreateTimetableColumnRowDto,
  ): Promise<TimetableColumnRow> {
    await this.getOwned(schoolId, timetableColumnId);
    return this.rows.save(this.rows.create({ timetableColumnId, ...dto }));
  }

  async updateRow(
    schoolId: string,
    rowId: string,
    dto: UpdateTimetableColumnRowDto,
  ): Promise<TimetableColumnRow> {
    const row = await this.getOwnedRow(schoolId, rowId);
    Object.assign(row, dto);
    return this.rows.save(row);
  }

  async removeRow(schoolId: string, rowId: string): Promise<void> {
    const row = await this.getOwnedRow(schoolId, rowId);
    await this.rows.remove(row);
  }

  private async getOwnedRow(
    schoolId: string,
    rowId: string,
  ): Promise<TimetableColumnRow> {
    const row = await this.rows.findByIdAndSchool(rowId, schoolId);
    if (!row) {
      throw new NotFoundException('Timetable column row not found');
    }
    return row;
  }

  private duplicateOr(error: unknown, shortName: string): unknown {
    if (isDuplicateEntryError(error)) {
      return new ConflictException(
        `A timetable column named "${shortName}" already exists at this school`,
      );
    }
    return error;
  }
}
