export const PERSON_GENDERS = ['M', 'F', 'Other', 'Unspecified'] as const;
export type PersonGender = (typeof PERSON_GENDERS)[number];

export const PERSON_STATUSES = ['Full', 'Expected', 'Left', 'PendingApproval'] as const;
export type PersonStatus = (typeof PERSON_STATUSES)[number];

export const PERSON_PHONE_TYPES = [
  'Mobile',
  'Home',
  'Work',
  'Fax',
  'Pager',
  'Other',
] as const;
export type PersonPhoneType = (typeof PERSON_PHONE_TYPES)[number];

export const PERSON_OAUTH_PROVIDERS = ['Google', 'Microsoft', 'Generic'] as const;
export type PersonOAuthProvider = (typeof PERSON_OAUTH_PROVIDERS)[number];
