import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { PersonOAuthProvider } from '@purpleschools/shared-types';
import { PersonOAuthConnection } from '../entities/person-oauth-connection.entity';

@Injectable()
export class PersonOAuthConnectionsRepository extends Repository<PersonOAuthConnection> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(PersonOAuthConnection, dataSource.createEntityManager());
  }

  findByPersonAndProvider(
    personId: string,
    provider: PersonOAuthProvider,
  ): Promise<PersonOAuthConnection | null> {
    return this.findOne({ where: { personId, provider } });
  }
}
