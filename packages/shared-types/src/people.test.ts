import { describe, expect, it } from "vitest";
import {
  PERSON_GENDERS,
  PERSON_OAUTH_PROVIDERS,
  PERSON_PHONE_TYPES,
  PERSON_STATUSES,
} from "./people";

describe("people shared constants", () => {
  it("defines the 4 gender values, matching Gibbon's gibbonPerson.gender enum", () => {
    expect(PERSON_GENDERS).toEqual(["M", "F", "Other", "Unspecified"]);
  });

  it("defines the 4 person status values", () => {
    expect(PERSON_STATUSES).toEqual(["Full", "Expected", "Left", "PendingApproval"]);
  });

  it("defines the 6 phone types", () => {
    expect(PERSON_PHONE_TYPES).toEqual([
      "Mobile",
      "Home",
      "Work",
      "Fax",
      "Pager",
      "Other",
    ]);
  });

  it("defines the 3 OAuth providers", () => {
    expect(PERSON_OAUTH_PROVIDERS).toEqual(["Google", "Microsoft", "Generic"]);
  });
});
