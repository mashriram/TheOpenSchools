import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeopleModule } from '../people/people.module';
import { SchoolModule } from '../school/school.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { RbacModule } from '../rbac/rbac.module';
import { AttendanceCode } from './entities/attendance-code.entity';
import { AttendanceCodeRole } from './entities/attendance-code-role.entity';
import { AttendanceLogPerson } from './entities/attendance-log-person.entity';
import { AttendanceLogFormGroup } from './entities/attendance-log-form-group.entity';
import { AttendanceLogCourseClass } from './entities/attendance-log-course-class.entity';
import { AttendanceCodesRepository } from './repositories/attendance-codes.repository';
import { AttendanceCodeRolesRepository } from './repositories/attendance-code-roles.repository';
import { AttendanceLogPeopleRepository } from './repositories/attendance-log-people.repository';
import { AttendanceLogFormGroupsRepository } from './repositories/attendance-log-form-groups.repository';
import { AttendanceLogCourseClassesRepository } from './repositories/attendance-log-course-classes.repository';
import { AttendanceCodesService } from './attendance-codes.service';
import { AttendanceRegisterService } from './attendance-register.service';
import { AttendanceAccessService } from './attendance-access.service';
import { AttendanceCodesController } from './attendance-codes.controller';
import { AttendanceRegisterController } from './attendance-register.controller';
import { AttendanceQueryController } from './attendance-query.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttendanceCode,
      AttendanceCodeRole,
      AttendanceLogPerson,
      AttendanceLogFormGroup,
      AttendanceLogCourseClass,
    ]),
    // For Person/FamilyAdult/FamilyChild lookups and StudentEnrolment
    // (form-group membership validation for register-taking).
    PeopleModule,
    // For FormGroup ownership checks.
    SchoolModule,
    // For CourseClass ownership + CourseClassPerson enrolment checks.
    CurriculumModule,
    // For PoliciesGuard, used by every controller below via @UseGuards().
    RbacModule,
  ],
  controllers: [
    AttendanceCodesController,
    AttendanceRegisterController,
    AttendanceQueryController,
  ],
  providers: [
    AttendanceCodesRepository,
    AttendanceCodeRolesRepository,
    AttendanceLogPeopleRepository,
    AttendanceLogFormGroupsRepository,
    AttendanceLogCourseClassesRepository,
    AttendanceCodesService,
    AttendanceRegisterService,
    AttendanceAccessService,
  ],
  exports: [
    AttendanceCodesRepository,
    AttendanceCodeRolesRepository,
    AttendanceLogPeopleRepository,
    AttendanceLogFormGroupsRepository,
    AttendanceLogCourseClassesRepository,
  ],
})
export class AttendanceModule {}
