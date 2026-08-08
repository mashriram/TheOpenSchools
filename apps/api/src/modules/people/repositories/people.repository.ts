import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Person } from '../entities/person.entity';

@Injectable()
export class PeopleRepository extends Repository<Person> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Person, dataSource.createEntityManager());
  }

  findByEmail(schoolId: string, email: string): Promise<Person | null> {
    return this.findOne({ where: { schoolId, email } });
  }

  findBySchool(schoolId: string): Promise<Person[]> {
    return this.find({ where: { schoolId } });
  }

  /**
   * A fraction of Gibbon's 15+ student_manage.php/staff_manage.php filter
   * variants (role, form group) - core fields/screens now, grow
   * incrementally later, matching the plan's existing scoping decision.
   *
   * Joins raw tables rather than declared entity relations (Person has no
   * `personRoles`/`studentEnrolments` back-reference), so the schoolId
   * scope is applied explicitly here rather than implicitly via a relation -
   * required per this codebase's own QueryBuilder tenant-scoping rule.
   */
  findBySchoolWithFilters(
    schoolId: string,
    filters: { roleName?: string; formGroupId?: string },
  ): Promise<Person[]> {
    const qb = this.createQueryBuilder('person').where(
      'person.schoolId = :schoolId',
      { schoolId },
    );

    if (filters.roleName) {
      qb.innerJoin(
        'person_roles',
        'personRole',
        'personRole.personId = person.id',
      ).innerJoin(
        'rbac_roles',
        'role',
        'role.id = personRole.roleId AND role.name = :roleName',
        { roleName: filters.roleName },
      );
    }

    if (filters.formGroupId) {
      qb.innerJoin(
        'student_enrolments',
        'enrolment',
        'enrolment.personId = person.id AND enrolment.formGroupId = :formGroupId',
        { formGroupId: filters.formGroupId },
      );
    }

    return qb.getMany();
  }
}
