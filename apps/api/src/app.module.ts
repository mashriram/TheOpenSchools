import {
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { SchoolModule } from './modules/school/school.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { PeopleModule } from './modules/people/people.module';
import { AuthModule } from './modules/auth/auth.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';
import { TimetableModule } from './modules/timetable/timetable.module';
import { MarkbookModule } from './modules/markbook/markbook.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { IndividualNeedsModule } from './modules/individual-needs/individual-needs.module';
import { RequestContextInterceptor } from './common/request-context.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    SchoolModule,
    RbacModule,
    PeopleModule,
    AuthModule,
    ComplianceModule,
    CurriculumModule,
    TimetableModule,
    MarkbookModule,
    AttendanceModule,
    IndividualNeedsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      // Registered as a provider (not app.useGlobalPipes in main.ts) so it
      // also applies to e2e tests, which build the Nest application
      // directly via createNestApplication() and never run main.ts.
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    {
      // Same reasoning: needs to run for e2e tests too, and every request
      // needs the actor/school context available for AuditService.
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  // Same reasoning as the ValidationPipe above: configure() runs for any
  // NestApplication built from this module, main.ts or e2e test alike,
  // unlike app.use() in main.ts which e2e tests never execute.
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('*');
  }
}
