import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isDuplicateEntryError } from '../../common/duplicate-entry-error';
import { MessengerCannedResponsesRepository } from './repositories/messenger-canned-responses.repository';
import { MessengerCannedResponse } from './entities/messenger-canned-response.entity';
import { CreateCannedResponseDto } from './dto/create-canned-response.dto';
import { UpdateCannedResponseDto } from './dto/update-canned-response.dto';

@Injectable()
export class MessengerCannedResponsesService {
  constructor(
    private readonly cannedResponses: MessengerCannedResponsesRepository,
  ) {}

  list(schoolId: string): Promise<MessengerCannedResponse[]> {
    return this.cannedResponses.findBySchool(schoolId);
  }

  async create(
    schoolId: string,
    dto: CreateCannedResponseDto,
  ): Promise<MessengerCannedResponse> {
    try {
      return await this.cannedResponses.save(
        this.cannedResponses.create({ schoolId, ...dto }),
      );
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A canned response named "${dto.name}" already exists for this school`,
        );
      }
      throw error;
    }
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateCannedResponseDto,
  ): Promise<MessengerCannedResponse> {
    const cannedResponse = await this.getOwned(schoolId, id);
    Object.assign(cannedResponse, dto);

    try {
      return await this.cannedResponses.save(cannedResponse);
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ConflictException(
          `A canned response named "${cannedResponse.name}" already exists for this school`,
        );
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string): Promise<void> {
    const cannedResponse = await this.getOwned(schoolId, id);
    await this.cannedResponses.softRemove(cannedResponse);
  }

  private async getOwned(
    schoolId: string,
    id: string,
  ): Promise<MessengerCannedResponse> {
    const cannedResponse = await this.cannedResponses.findByIdAndSchool(
      id,
      schoolId,
    );
    if (!cannedResponse) {
      throw new NotFoundException('Canned response not found');
    }
    return cannedResponse;
  }
}
