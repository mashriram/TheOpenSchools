import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Action } from '../entities/action.entity';

@Injectable()
export class ActionsRepository extends Repository<Action> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Action, dataSource.createEntityManager());
  }

  findByName(name: string): Promise<Action | null> {
    return this.findOne({ where: { name } });
  }

  findByModule(moduleId: string): Promise<Action[]> {
    return this.find({ where: { moduleId }, order: { precedence: 'ASC' } });
  }
}
