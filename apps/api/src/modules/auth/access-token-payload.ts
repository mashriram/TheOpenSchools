/** Carried in every access token: who, which school, and acting as which role. */
export interface AccessTokenPayload {
  sub: string;
  schoolId: string;
  activeRoleId: string;
}
