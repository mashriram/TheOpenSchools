import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { CourseClassesRepository } from './repositories/course-classes.repository';
import { CoursesService } from './courses.service';
import { CourseClass } from './entities/course-class.entity';
import { CreateCourseClassDto } from './dto/create-course-class.dto';
import { UpdateCourseClassDto } from './dto/update-course-class.dto';

@Injectable()
export class CourseClassesService {
  constructor(
    private readonly courseClasses: CourseClassesRepository,
    private readonly courses: CoursesService,
  ) {}

  async list(schoolId: string, courseId: string): Promise<CourseClass[]> {
    await this.courses.getOwned(schoolId, courseId);
    return this.courseClasses.findByCourseAndSchool(courseId, schoolId);
  }

  async create(
    schoolId: string,
    courseId: string,
    dto: CreateCourseClassDto,
  ): Promise<CourseClass> {
    await this.courses.getOwned(schoolId, courseId);

    try {
      return await this.courseClasses.save(
        this.courseClasses.create({
          courseId,
          name: dto.name,
          shortName: dto.shortName,
          reportable: dto.reportable ?? true,
          takesAttendance: dto.takesAttendance ?? true,
          enrolmentMin: dto.enrolmentMin ?? null,
          enrolmentMax: dto.enrolmentMax ?? null,
        }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A class with short name "${dto.shortName}" already exists for this course`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateCourseClassDto,
  ): Promise<CourseClass> {
    const courseClass = await this.getOwned(schoolId, id);
    Object.assign(courseClass, dto);
    try {
      return await this.courseClasses.save(courseClass);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A class with short name "${courseClass.shortName}" already exists for this course`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const courseClass = await this.getOwned(schoolId, id);
    await this.courseClasses.softRemove(courseClass);
  }

  /** Also used by CourseEnrolmentService to authorize a CourseClass id. */
  async getOwned(schoolId: string, id: string): Promise<CourseClass> {
    const courseClass = await this.courseClasses.findByIdAndSchool(
      id,
      schoolId,
    );
    if (!courseClass) {
      throw new NotFoundException('Course class not found');
    }
    return courseClass;
  }
}
