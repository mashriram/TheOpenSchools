import { Injectable } from '@nestjs/common';
import { MessengersRepository } from './repositories/messengers.repository';
import { SettingsRepository } from '../school/repositories/settings.repository';

/**
 * A new capability Gibbon lacks entirely for Messenger (plan §F). No cron
 * infra exists anywhere in this codebase yet, so - matching Foundation's
 * "request-driven" design already established for GDPR erasure - this is
 * an explicit, admin-triggerable action (see MessengerController's
 * `/messenger/retention/scrub` route), not a background job. A school
 * without the 'Messenger'/'retentionWindowMonths' Setting configured (or
 * with it blank) is treated as "scrubbing disabled", not "scrub
 * everything" - an absent config must never silently maximize deletion.
 */
@Injectable()
export class MessengerRetentionService {
  constructor(
    private readonly messengers: MessengersRepository,
    private readonly settings: SettingsRepository,
  ) {}

  async scrubExpiredMessages(schoolId: string): Promise<number> {
    const setting = await this.settings.findBySchoolScopeAndName(
      schoolId,
      'Messenger',
      'retentionWindowMonths',
    );
    const months = setting?.value ? Number(setting.value) : NaN;
    if (!Number.isFinite(months) || months <= 0) {
      return 0;
    }

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const expired = await this.messengers.findBySchoolOlderThan(
      schoolId,
      cutoff,
    );
    if (expired.length === 0) {
      return 0;
    }

    await this.messengers.save(
      expired.map((message) => {
        message.subject = '[Scrubbed by retention policy]';
        message.body = '[Scrubbed by retention policy]';
        return message;
      }),
    );
    return expired.length;
  }
}
