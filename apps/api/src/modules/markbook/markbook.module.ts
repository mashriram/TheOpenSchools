import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeopleModule } from '../people/people.module';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { RbacModule } from '../rbac/rbac.module';
import { Scale } from './entities/scale.entity';
import { ScaleGrade } from './entities/scale-grade.entity';
import { MarkbookColumn } from './entities/markbook-column.entity';
import { MarkbookEntry } from './entities/markbook-entry.entity';
import { MarkbookTarget } from './entities/markbook-target.entity';
import { MarkbookWeight } from './entities/markbook-weight.entity';
import { ScalesRepository } from './repositories/scales.repository';
import { ScaleGradesRepository } from './repositories/scale-grades.repository';
import { MarkbookColumnsRepository } from './repositories/markbook-columns.repository';
import { MarkbookEntriesRepository } from './repositories/markbook-entries.repository';
import { MarkbookTargetsRepository } from './repositories/markbook-targets.repository';
import { MarkbookWeightsRepository } from './repositories/markbook-weights.repository';
import { ScalesService } from './scales.service';
import { ScaleGradesService } from './scale-grades.service';
import { MarkbookColumnsService } from './markbook-columns.service';
import { MarkbookEntriesService } from './markbook-entries.service';
import { MarkbookTargetsService } from './markbook-targets.service';
import { MarkbookWeightsService } from './markbook-weights.service';
import { ScalesController } from './scales.controller';
import { ScaleGradesController } from './scale-grades.controller';
import { MarkbookColumnsController } from './markbook-columns.controller';
import { MarkbookEntriesController } from './markbook-entries.controller';
import { MarkbookTargetsController } from './markbook-targets.controller';
import { MarkbookWeightsController } from './markbook-weights.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Scale,
      ScaleGrade,
      MarkbookColumn,
      MarkbookEntry,
      MarkbookTarget,
      MarkbookWeight,
    ]),
    // For Person/FamilyAdult/FamilyChild lookups (personId validation, the
    // parent childDataAccess check) and CourseClass/CourseClassPerson
    // (column/target/weight ownership, personal-target lookups).
    PeopleModule,
    CurriculumModule,
    // For PoliciesGuard, used by every controller below via @UseGuards().
    RbacModule,
  ],
  controllers: [
    ScalesController,
    ScaleGradesController,
    MarkbookColumnsController,
    MarkbookEntriesController,
    MarkbookTargetsController,
    MarkbookWeightsController,
  ],
  providers: [
    ScalesRepository,
    ScaleGradesRepository,
    MarkbookColumnsRepository,
    MarkbookEntriesRepository,
    MarkbookTargetsRepository,
    MarkbookWeightsRepository,
    ScalesService,
    ScaleGradesService,
    MarkbookColumnsService,
    MarkbookEntriesService,
    MarkbookTargetsService,
    MarkbookWeightsService,
  ],
  exports: [
    ScalesRepository,
    ScaleGradesRepository,
    MarkbookColumnsRepository,
    MarkbookEntriesRepository,
    MarkbookTargetsRepository,
    MarkbookWeightsRepository,
  ],
})
export class MarkbookModule {}
