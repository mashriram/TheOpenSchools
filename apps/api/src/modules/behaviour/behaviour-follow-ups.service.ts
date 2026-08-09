import { Injectable, NotFoundException } from '@nestjs/common';
import { BehaviourFollowUpsRepository } from './repositories/behaviour-follow-ups.repository';
import { BehaviourService } from './behaviour.service';
import { BehaviourFollowUp } from './entities/behaviour-follow-up.entity';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';

@Injectable()
export class BehaviourFollowUpsService {
  constructor(
    private readonly followUps: BehaviourFollowUpsRepository,
    private readonly behaviour: BehaviourService,
  ) {}

  async list(
    schoolId: string,
    behaviourId: string,
  ): Promise<BehaviourFollowUp[]> {
    await this.behaviour.getOwned(schoolId, behaviourId);
    return this.followUps.findByBehaviour(behaviourId);
  }

  async create(
    schoolId: string,
    behaviourId: string,
    authorPersonId: string,
    dto: CreateFollowUpDto,
  ): Promise<BehaviourFollowUp> {
    await this.behaviour.getOwned(schoolId, behaviourId);
    return this.followUps.save(
      this.followUps.create({
        behaviourId,
        personId: authorPersonId,
        followUp: dto.followUp,
      }),
    );
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const followUp = await this.followUps.findByIdAndSchool(id, schoolId);
    if (!followUp) {
      throw new NotFoundException('Follow-up not found');
    }
    await this.followUps.remove(followUp);
  }
}
