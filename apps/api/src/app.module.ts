import {
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    SchoolModule,
    RbacModule,
    PeopleModule,
    AuthModule,
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
