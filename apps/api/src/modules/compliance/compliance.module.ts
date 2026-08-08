import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeopleModule } from '../people/people.module';
import { RbacModule } from '../rbac/rbac.module';
import { AuthModule } from '../auth/auth.module';
import { AuditLog } from './entities/audit-log.entity';
import { ConsentRecord } from './entities/consent-record.entity';
import { AuditLogsRepository } from './repositories/audit-logs.repository';
import { ConsentRecordsRepository } from './repositories/consent-records.repository';
import { AuditService } from './audit.service';
import { AuditSubscriber } from './audit.subscriber';
import { GdprService } from './gdpr.service';
import { GdprController } from './gdpr.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog, ConsentRecord]),
    PeopleModule,
    RbacModule,
    AuthModule,
  ],
  controllers: [GdprController],
  providers: [
    AuditLogsRepository,
    ConsentRecordsRepository,
    AuditService,
    // Instantiating this is what registers it with the DataSource (see its
    // own docstring) - nothing else needs to inject AuditSubscriber
    // directly, but it must still be listed here for Nest to construct it.
    AuditSubscriber,
    GdprService,
  ],
  exports: [AuditLogsRepository, ConsentRecordsRepository, AuditService],
})
export class ComplianceModule {}
