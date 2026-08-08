import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Hand-edited after `migration:generate`: TypeORM's auto-diff produced a
 * DROP COLUMN + ADD COLUMN pair, which would silently discard any existing
 * usernames. A plain MODIFY COLUMN resizes in place and leaves the existing
 * unique index on (schoolId, username) untouched.
 */
export class M7WidenPersonCredentialUsername1786154949102 implements MigrationInterface {
  name = 'M7WidenPersonCredentialUsername1786154949102';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`person_credentials\` MODIFY COLUMN \`username\` varchar(255) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`person_credentials\` MODIFY COLUMN \`username\` varchar(60) NOT NULL`,
    );
  }
}
