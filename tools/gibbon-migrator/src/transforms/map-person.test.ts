import { describe, expect, it } from "vitest";
import { mapPerson } from "./map-person";
import { GibbonPersonRow } from "../gibbon-types";

const BASE_ROW: GibbonPersonRow = {
  gibbonPersonID: "0000000119",
  title: "Mr.",
  surname: "Schultz",
  firstName: "Nathan",
  preferredName: "",
  gender: "M",
  username: "119",
  status: "Full",
  canLogin: "Y",
  gibbonRoleIDPrimary: "002",
  gibbonRoleIDAll: "002",
  dob: "1985-04-12",
  email: "119@gibbon.localhost",
  emailAlternate: null,
  gibbonHouseID: "010",
  studentID: "",
  dateStart: "2020-08-01",
  dateEnd: null,
  gibbonSchoolYearIDClassOf: null,
};

describe("mapPerson", () => {
  it("maps a fully-populated staff row", () => {
    const mapped = mapPerson(BASE_ROW, "new-uuid", "school-uuid");

    expect(mapped).toEqual({
      id: "new-uuid",
      schoolId: "school-uuid",
      title: "Mr.",
      surname: "Schultz",
      firstName: "Nathan",
      preferredName: null,
      gender: "M",
      status: "Full",
      dateOfBirth: "1985-04-12",
      email: "119@gibbon.localhost",
      emailAlternate: null,
      studentIdNumber: null,
      dateStart: "2020-08-01",
      dateEnd: null,
      gibbonHouseId: 10,
      gibbonClassOfSchoolYearId: null,
    });
  });

  it("maps Gibbon's 'Pending Approval' status to our 'PendingApproval' union value", () => {
    const mapped = mapPerson({ ...BASE_ROW, status: "Pending Approval" }, "id", "school");

    expect(mapped.status).toBe("PendingApproval");
  });

  it("keeps a real studentID rather than nulling it", () => {
    const mapped = mapPerson({ ...BASE_ROW, studentID: "S00123" }, "id", "school");

    expect(mapped.studentIdNumber).toBe("S00123");
  });

  it("leaves gibbonHouseId null when Gibbon has no house set", () => {
    const mapped = mapPerson({ ...BASE_ROW, gibbonHouseID: null }, "id", "school");

    expect(mapped.gibbonHouseId).toBeNull();
  });

  it("strips zerofill from gibbonSchoolYearIDClassOf when set", () => {
    const mapped = mapPerson(
      { ...BASE_ROW, gibbonSchoolYearIDClassOf: "025" },
      "id",
      "school",
    );

    expect(mapped.gibbonClassOfSchoolYearId).toBe(25);
  });
});
