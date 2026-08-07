import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokensRepository extends Repository<RefreshToken> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(RefreshToken, dataSource.createEntityManager());
  }

  findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.findOne({ where: { tokenHash } });
  }
}
