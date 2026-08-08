import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeopleModule } from '../people/people.module';
import { SchoolModule } from '../school/school.module';
import { RbacModule } from '../rbac/rbac.module';
import { Course } from './entities/course.entity';
import { CourseYearGroup } from './entities/course-year-group.entity';
import { CourseClass } from './entities/course-class.entity';
import { CourseClassPerson } from './entities/course-class-person.entity';
import { Unit } from './entities/unit.entity';
import { CoursesRepository } from './repositories/courses.repository';
import { CourseYearGroupsRepository } from './repositories/course-year-groups.repository';
import { CourseClassesRepository } from './repositories/course-classes.repository';
import { CourseClassPeopleRepository } from './repositories/course-class-people.repository';
import { UnitsRepository } from './repositories/units.repository';
import { CoursesService } from './courses.service';
import { CourseClassesService } from './course-classes.service';
import { CourseEnrolmentService } from './course-enrolment.service';
import { UnitsService } from './units.service';
import { CoursesController } from './courses.controller';
import { CourseClassesController } from './course-classes.controller';
import { CourseEnrolmentController } from './course-enrolment.controller';
import { UnitsController } from './units.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      CourseYearGroup,
      CourseClass,
      CourseClassPerson,
      Unit,
    ]),
    // CoursesService validates schoolYearId/departmentId/yearGroupIds belong
    // to the caller's school; CourseEnrolmentService validates personId does
    // too. Neither PeopleModule nor SchoolModule needs anything back from
    // this module, so a plain import suffices - no forwardRef() required.
    PeopleModule,
    SchoolModule,
    // For PoliciesGuard, used by every controller below via @UseGuards().
    RbacModule,
  ],
  controllers: [
    CoursesController,
    CourseClassesController,
    CourseEnrolmentController,
    UnitsController,
  ],
  providers: [
    CoursesRepository,
    CourseYearGroupsRepository,
    CourseClassesRepository,
    CourseClassPeopleRepository,
    UnitsRepository,
    CoursesService,
    CourseClassesService,
    CourseEnrolmentService,
    UnitsService,
  ],
  exports: [
    CoursesRepository,
    CourseYearGroupsRepository,
    CourseClassesRepository,
    CourseClassPeopleRepository,
    UnitsRepository,
  ],
})
export class CurriculumModule {}
