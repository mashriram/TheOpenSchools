import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeopleModule } from '../people/people.module';
import { SchoolModule } from '../school/school.module';
import { RbacModule } from '../rbac/rbac.module';
import { FinanceFeeCategory } from './entities/finance-fee-category.entity';
import { FinanceFee } from './entities/finance-fee.entity';
import { FinanceBillingSchedule } from './entities/finance-billing-schedule.entity';
import { FinanceInvoicee } from './entities/finance-invoicee.entity';
import { FinanceInvoice } from './entities/finance-invoice.entity';
import { FinanceInvoiceFee } from './entities/finance-invoice-fee.entity';
import { Payment } from './entities/payment.entity';
import { FinanceFeeCategoriesRepository } from './repositories/finance-fee-categories.repository';
import { FinanceFeesRepository } from './repositories/finance-fees.repository';
import { FinanceBillingSchedulesRepository } from './repositories/finance-billing-schedules.repository';
import { FinanceInvoiceesRepository } from './repositories/finance-invoicees.repository';
import { FinanceInvoicesRepository } from './repositories/finance-invoices.repository';
import { FinanceInvoiceFeesRepository } from './repositories/finance-invoice-fees.repository';
import { PaymentsRepository } from './repositories/payments.repository';
import { FinanceFeeCategoriesService } from './finance-fee-categories.service';
import { FinanceFeesService } from './finance-fees.service';
import { FinanceBillingSchedulesService } from './finance-billing-schedules.service';
import { FinanceInvoiceesService } from './finance-invoicees.service';
import { FinanceInvoicesService } from './finance-invoices.service';
import { FinanceInvoiceFeesService } from './finance-invoice-fees.service';
import { PaymentsService } from './payments.service';
import { StripeCheckoutService } from './stripe-checkout.service';
import { FinanceFeeCategoriesController } from './finance-fee-categories.controller';
import { FinanceFeesController } from './finance-fees.controller';
import { FinanceBillingSchedulesController } from './finance-billing-schedules.controller';
import { FinanceInvoiceesController } from './finance-invoicees.controller';
import { FinanceInvoicesController } from './finance-invoices.controller';
import { FinanceInvoiceFeesController } from './finance-invoice-fees.controller';
import { PaymentsController } from './payments.controller';
import { StripeCheckoutController } from './stripe-checkout.controller';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinanceFeeCategory,
      FinanceFee,
      FinanceBillingSchedule,
      FinanceInvoicee,
      FinanceInvoice,
      FinanceInvoiceFee,
      Payment,
    ]),
    // For Person/SchoolYear lookups (invoicee student, fee/schedule
    // ownership checks).
    PeopleModule,
    SchoolModule,
    // For PoliciesGuard, used by every guarded controller below.
    RbacModule,
  ],
  controllers: [
    FinanceFeeCategoriesController,
    FinanceFeesController,
    FinanceBillingSchedulesController,
    FinanceInvoiceesController,
    FinanceInvoicesController,
    FinanceInvoiceFeesController,
    PaymentsController,
    StripeCheckoutController,
    StripeWebhookController,
  ],
  providers: [
    FinanceFeeCategoriesRepository,
    FinanceFeesRepository,
    FinanceBillingSchedulesRepository,
    FinanceInvoiceesRepository,
    FinanceInvoicesRepository,
    FinanceInvoiceFeesRepository,
    PaymentsRepository,
    FinanceFeeCategoriesService,
    FinanceFeesService,
    FinanceBillingSchedulesService,
    FinanceInvoiceesService,
    FinanceInvoicesService,
    FinanceInvoiceFeesService,
    PaymentsService,
    StripeCheckoutService,
  ],
  exports: [
    FinanceFeeCategoriesRepository,
    FinanceFeesRepository,
    FinanceBillingSchedulesRepository,
    FinanceInvoiceesRepository,
    FinanceInvoicesRepository,
    FinanceInvoiceFeesRepository,
    PaymentsRepository,
  ],
})
export class FinanceModule {}
