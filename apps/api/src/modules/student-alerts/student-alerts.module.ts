import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeopleModule } from '../people/people.module';
import { SchoolModule } from '../school/school.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { RbacModule } from '../rbac/rbac.module';
import { AlertType } from './entities/alert-type.entity';
import { Alert } from './entities/alert.entity';
import { AlertTypesRepository } from './repositories/alert-types.repository';
import { AlertsRepository } from './repositories/alerts.repository';
import { AlertTypesService } from './alert-types.service';
import { AlertsService } from './alerts.service';
import { AlertTypesController } from './alert-types.controller';
import { AlertsController } from './alerts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertType, Alert]),
    // For Person/SchoolYear ownership checks on alerts.
    PeopleModule,
    SchoolModule,
    // For CourseClassesRepository (optional alert -> class context link).
    CurriculumModule,
    // For PoliciesGuard/CurrentAbility, used by every controller below.
    RbacModule,
  ],
  controllers: [AlertTypesController, AlertsController],
  providers: [
    AlertTypesRepository,
    AlertsRepository,
    AlertTypesService,
    AlertsService,
  ],
  exports: [AlertTypesRepository, AlertsRepository],
})
export class StudentAlertsModule {}
