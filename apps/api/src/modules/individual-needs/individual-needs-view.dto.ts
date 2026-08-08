import type {
  IndividualNeedDescriptorType,
  SafeguardingSeverityLevel,
} from '@purpleschools/shared-types';

export interface PersonDescriptorView {
  id: string;
  descriptor: IndividualNeedDescriptorType;
  level: SafeguardingSeverityLevel | null;
}

/**
 * Fixes Gibbon's real read-side gap directly (plan §M18): Gibbon's three
 * permission tiers (`_view`/`_viewContribute`/`_viewEdit`) only ever gate
 * *editing* which fields - all three tiers can read the complete narrative
 * content, with no read-side restriction at all. Here, a caller who only
 * has `individualNeeds.summary.view` (the base, broadly-granted tier) gets
 * this shape - descriptor/level only, never the narrative fields - and can
 * never receive an IndividualNeedsDetailDto no matter which endpoint they
 * call, because IndividualNeedsService.getForCaller() decides the shape
 * itself based on the caller's actual ability, not by trusting which route
 * they hit.
 */
export interface IndividualNeedsSummaryDto {
  personId: string;
  descriptors: PersonDescriptorView[];
}

/** Only returned to a caller who holds `individualNeeds.detail.view`. */
export interface IndividualNeedsDetailDto extends IndividualNeedsSummaryDto {
  strategies: string | null;
  targets: string | null;
  notes: string | null;
  customFields: Record<string, unknown> | null;
}
