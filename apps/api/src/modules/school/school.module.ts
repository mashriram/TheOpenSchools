import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { School } from './entities/school.entity';
import { SchoolYear } from './entities/school-year.entity';
import { SchoolYearTerm } from './entities/school-year-term.entity';
import { YearGroup } from './entities/year-group.entity';
import { FormGroup } from './entities/form-group.entity';
import { FormGroupStaff } from './entities/form-group-staff.entity';
import { House } from './entities/house.entity';
import { Space } from './entities/space.entity';
import { Department } from './entities/department.entity';
import { Setting } from './entities/setting.entity';
import { SchoolsRepository } from './repositories/schools.repository';
import { SchoolYearsRepository } from './repositories/school-years.repository';
import { SchoolYearTermsRepository } from './repositories/school-year-terms.repository';
import { YearGroupsRepository } from './repositories/year-groups.repository';
import { FormGroupsRepository } from './repositories/form-groups.repository';
import { FormGroupStaffRepository } from './repositories/form-group-staff.repository';
import { HousesRepository } from './repositories/houses.repository';
import { SpacesRepository } from './repositories/spaces.repository';
import { DepartmentsRepository } from './repositories/departments.repository';
import { SettingsRepository } from './repositories/settings.repository';
import { YearGroupsService } from './year-groups.service';
import { FormGroupsService } from './form-groups.service';
import { FormGroupStaffService } from './form-group-staff.service';
import { HousesService } from './houses.service';
import { SpacesService } from './spaces.service';
import { DepartmentsService } from './departments.service';
import { SettingsService } from './settings.service';
import { YearGroupsController } from './year-groups.controller';
import { FormGroupsController } from './form-groups.controller';
import { HousesController } from './houses.controller';
import { SpacesController } from './spaces.controller';
import { DepartmentsController } from './departments.controller';
import { SettingsController } from './settings.controller';

@Module({
  // TypeOrmModule.forFeature is what makes `autoLoadEntities: true` register
  // these entities with the DataSource - without it, the custom repositories
  // below fail at runtime with "No metadata for <Entity> was found", even
  // though nothing here actually injects the generated Repository tokens.
  imports: [
    TypeOrmModule.forFeature([
      School,
      SchoolYear,
      SchoolYearTerm,
      YearGroup,
      FormGroup,
      FormGroupStaff,
      House,
      Space,
      Department,
      Setting,
    ]),
    // YearGroupsService/FormGroupStaffService validate that a given personId
    // belongs to the caller's school before wiring a cross-entity reference.
    PeopleModule,
    // For PoliciesGuard, used by every controller below via @UseGuards().
    RbacModule,
  ],
  controllers: [
    YearGroupsController,
    FormGroupsController,
    HousesController,
    SpacesController,
    DepartmentsController,
    SettingsController,
  ],
  providers: [
    SchoolsRepository,
    SchoolYearsRepository,
    SchoolYearTermsRepository,
    YearGroupsRepository,
    FormGroupsRepository,
    FormGroupStaffRepository,
    HousesRepository,
    SpacesRepository,
    DepartmentsRepository,
    SettingsRepository,
    YearGroupsService,
    FormGroupsService,
    FormGroupStaffService,
    HousesService,
    SpacesService,
    DepartmentsService,
    SettingsService,
  ],
  exports: [
    SchoolsRepository,
    SchoolYearsRepository,
    SchoolYearTermsRepository,
    YearGroupsRepository,
    FormGroupsRepository,
    FormGroupStaffRepository,
    HousesRepository,
    SpacesRepository,
    DepartmentsRepository,
    SettingsRepository,
  ],
})
export class SchoolModule {}
