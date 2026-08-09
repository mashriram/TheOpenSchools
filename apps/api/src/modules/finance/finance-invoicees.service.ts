import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FinanceInvoiceesRepository } from './repositories/finance-invoicees.repository';
import { PeopleRepository } from '../people/repositories/people.repository';
import { FinanceInvoicee } from './entities/finance-invoicee.entity';
import { CreateInvoiceeDto } from './dto/create-invoicee.dto';

@Injectable()
export class FinanceInvoiceesService {
  constructor(
    private readonly invoicees: FinanceInvoiceesRepository,
    private readonly people: PeopleRepository,
  ) {}

  async listForStudent(
    schoolId: string,
    studentPersonId: string,
  ): Promise<FinanceInvoicee[]> {
    await this.assertPersonBelongsToSchool(schoolId, studentPersonId);
    return this.invoicees.findByStudent(studentPersonId);
  }

  async create(
    schoolId: string,
    dto: CreateInvoiceeDto,
  ): Promise<FinanceInvoicee> {
    await this.assertPersonBelongsToSchool(schoolId, dto.studentPersonId);

    return this.invoicees.save(
      this.invoicees.create({
        studentPersonId: dto.studentPersonId,
        invoiceTo: dto.invoiceTo,
        companyName: dto.companyName ?? null,
        companyContact: dto.companyContact ?? null,
        companyAddress: dto.companyAddress ?? null,
        companyEmail: dto.companyEmail ?? null,
        companyPhone: dto.companyPhone ?? null,
        companyCCFamily: dto.companyCCFamily ?? null,
        companyAll: dto.companyAll ?? null,
      }),
    );
  }

  /** Also used by FinanceInvoicesService to authorize an invoicee id. */
  async getOwned(schoolId: string, id: string): Promise<FinanceInvoicee> {
    const invoicee = await this.invoicees.findByIdAndSchool(id, schoolId);
    if (!invoicee) {
      throw new NotFoundException('Invoicee not found');
    }
    return invoicee;
  }

  private async assertPersonBelongsToSchool(
    schoolId: string,
    personId: string,
  ): Promise<void> {
    const person = await this.people.findOne({
      where: { id: personId, schoolId },
    });
    if (!person) {
      throw new BadRequestException(
        'studentPersonId does not belong to this school',
      );
    }
  }
}
