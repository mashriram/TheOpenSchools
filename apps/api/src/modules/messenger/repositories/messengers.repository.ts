import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { Messenger } from '../entities/messenger.entity';

@Injectable()
export class MessengersRepository extends Repository<Messenger> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Messenger, dataSource.createEntityManager());
  }

  findBySchool(schoolId: string): Promise<Messenger[]> {
    return this.find({ where: { schoolId }, order: { createdAt: 'DESC' } });
  }

  findByIdAndSchool(id: string, schoolId: string): Promise<Messenger | null> {
    return this.findOne({ where: { id, schoolId } });
  }

  /** Used by MessengerRetentionService's scrub-after-window job (plan §F). */
  findBySchoolOlderThan(schoolId: string, cutoff: Date): Promise<Messenger[]> {
    return this.find({ where: { schoolId, createdAt: LessThan(cutoff) } });
  }
}
