import { describe, expect, it } from "vitest";
import { mapPersonCredential } from "./map-person-credential";
import { GibbonPersonRow } from "../gibbon-types";

const BASE_ROW: GibbonPersonRow = {
  gibbonPersonID: "0000000119",
  title: "Mr.",
  surname: "Schultz",
  firstName: "Nathan",
  preferredName: "Nathan",
  gender: "M",
  username: "119",
  status: "Full",
  canLogin: "Y",
  gibbonRoleIDPrimary: "002",
  gibbonRoleIDAll: "002",
  dob: null,
  email: "119@gibbon.localhost",
  emailAlternate: null,
  gibbonHouseID: "010",
  studentID: "",
  dateStart: null,
  dateEnd: null,
  gibbonSchoolYearIDClassOf: null,
};

describe("mapPersonCredential", () => {
  it("always forces canLogin: false and passwordForceReset: true (credentials cannot be migrated)", () => {
    const mapped = mapPersonCredential(BASE_ROW, "cred-uuid", "person-uuid", "school-uuid");

    expect(mapped.canLogin).toBe(false);
    expect(mapped.passwordForceReset).toBe(true);
  });

  it("uses Gibbon's username when present", () => {
    const mapped = mapPersonCredential(BASE_ROW, "cred-uuid", "person-uuid", "school-uuid");

    expect(mapped.username).toBe("119");
  });

  it("falls back to email when Gibbon's username is null", () => {
    const mapped = mapPersonCredential(
      { ...BASE_ROW, username: null },
      "cred-uuid",
      "person-uuid",
      "school-uuid",
    );

    expect(mapped.username).toBe("119@gibbon.localhost");
  });

  it("never stores a value that looks like a real, verifiable password hash", () => {
    const mapped = mapPersonCredential(BASE_ROW, "cred-uuid", "person-uuid", "school-uuid");

    expect(mapped.passwordHash.startsWith("unmigrated:")).toBe(true);
  });

  it("produces a different placeholder hash on every call (not guessable/reused)", () => {
    const first = mapPersonCredential(BASE_ROW, "cred-uuid", "person-uuid", "school-uuid");
    const second = mapPersonCredential(BASE_ROW, "cred-uuid", "person-uuid", "school-uuid");

    expect(first.passwordHash).not.toBe(second.passwordHash);
  });
});
