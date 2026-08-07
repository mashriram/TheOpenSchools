import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { PersonGender, PersonStatus } from '@purpleschools/shared-types';
import { SoftDeletableEntity } from '../../../common/soft-deletable.entity';
import { School } from '../../school/entities/school.entity';
import { SchoolYear } from '../../school/entities/school-year.entity';

/**
 * Full 1:1 field parity with gibbonPerson, minus fields deferred until their
 * owning feature exists (gibbonApplicationFormID - Admissions, Tier 3;
 * gibbonThemeIDPersonal/gibboni18nIDPersonal - theme/i18n management, not
 * designed yet) and fields normalized into child tables (phone1-4 ->
 * PersonPhone, emergency1/2 -> PersonEmergencyContact).
 *
 * `houseId` is a soft reference (plain column, no FK) - House doesn't exist
 * yet (it lands in M3); the real FK relation gets wired then, the same
 * pattern used for YearGroup.headOfYearPersonId while Person didn't exist.
 */
@Entity('people')
@Index(['schoolId', 'email'], { unique: true })
export class Person extends SoftDeletableEntity {
  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ type: 'varchar', length: 36 })
  schoolId: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 60 })
  surname: string;

  @Column({ type: 'varchar', length: 60 })
  firstName: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  preferredName: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  officialName: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  nameInCharacters: string | null;

  @Column({ type: 'varchar', length: 16, default: 'Unspecified' })
  gender: PersonGender;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailAlternate: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  photoUrl: string | null;

  @Column({ type: 'varchar', length: 20, default: 'Full' })
  status: PersonStatus;

  @Column({ type: 'text', nullable: true })
  address1: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address1District: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address1Country: string | null;

  @Column({ type: 'text', nullable: true })
  address2: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address2District: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address2Country: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  languageFirst: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  languageSecond: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  languageThird: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  countryOfBirth: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  ethnicity: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  religion: string | null;

  @Column({ type: 'varchar', length: 90, nullable: true })
  profession: string | null;

  @Column({ type: 'varchar', length: 90, nullable: true })
  employer: string | null;

  @Column({ type: 'varchar', length: 90, nullable: true })
  jobTitle: string | null;

  /** Soft reference to House (M3) - no FK constraint until House exists. */
  @Column({ type: 'varchar', length: 36, nullable: true })
  houseId: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  studentIdNumber: string | null;

  @Column({ type: 'date', nullable: true })
  dateStart: string | null;

  @Column({ type: 'date', nullable: true })
  dateEnd: string | null;

  @ManyToOne(() => SchoolYear, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'classOfSchoolYearId' })
  classOfSchoolYear: SchoolYear | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  classOfSchoolYearId: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  lastSchool: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  nextSchool: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  departureReason: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transport: string | null;

  @Column({ type: 'text', nullable: true })
  transportNotes: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  lockerNumber: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  vehicleRegistration: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  personalBackground: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  dayType: string | null;

  @Column({ type: 'text', nullable: true })
  calendarFeedPersonal: string | null;

  @Column({ type: 'boolean', default: true })
  viewCalendarSchool: boolean;

  @Column({ type: 'boolean', default: true })
  viewCalendarPersonal: boolean;

  @Column({ type: 'boolean', default: false })
  viewCalendarSpaceBooking: boolean;

  @Column({ type: 'text', nullable: true })
  studentAgreements: string | null;

  @Column({ type: 'boolean', default: true })
  receiveNotificationEmails: boolean;

  @Column({ type: 'timestamp', nullable: true })
  messengerLastReadAt: Date | null;

  @Column({ type: 'boolean', nullable: true })
  cookieConsent: boolean | null;

  @Column({ type: 'text', nullable: true })
  privacy: string | null;

  @Column({ type: 'text', nullable: true })
  preferences: string | null;

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, unknown> | null;
}
