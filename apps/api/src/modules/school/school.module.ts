import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from './entities/school.entity';
import { SchoolYear } from './entities/school-year.entity';
import { SchoolYearTerm } from './entities/school-year-term.entity';
import { SchoolsRepository } from './repositories/schools.repository';
import { SchoolYearsRepository } from './repositories/school-years.repository';
import { SchoolYearTermsRepository } from './repositories/school-year-terms.repository';

@Module({
  // TypeOrmModule.forFeature is what makes `autoLoadEntities: true` register
  // these entities with the DataSource - without it, the custom repositories
  // below fail at runtime with "No metadata for <Entity> was found", even
  // though nothing here actually injects the generated Repository tokens.
  imports: [TypeOrmModule.forFeature([School, SchoolYear, SchoolYearTerm])],
  providers: [
    SchoolsRepository,
    SchoolYearsRepository,
    SchoolYearTermsRepository,
  ],
  exports: [
    SchoolsRepository,
    SchoolYearsRepository,
    SchoolYearTermsRepository,
  ],
})
export class SchoolModule {}
