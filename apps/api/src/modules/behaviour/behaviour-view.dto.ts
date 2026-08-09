import type { BehaviourType } from './entities/behaviour.entity';

/**
 * Reproduces Gibbon's one genuinely good confidentiality mechanism in the
 * safeguarding cluster: a viewer scoped to themselves (`_myself`) or their
 * own child (`_myChildren`) never has `comment`/`followup`/`level` added
 * to their response at all - enforced server-side by which fields get
 * selected, not client-side hiding (see BehaviourService.toView()).
 */
export interface BehaviourSummaryView {
  id: string;
  date: string;
  personId: string;
  type: BehaviourType;
  descriptor: string | null;
}

/** Only returned to a Staff/Other viewer, never to self/child. */
export interface BehaviourDetailView extends BehaviourSummaryView {
  level: string | null;
  comment: string | null;
  followup: string | null;
}
