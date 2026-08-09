import { MigrationInterface, QueryRunner } from 'typeorm';

export class M19AddActionDefaultConditions1786210886136 implements MigrationInterface {
  name = 'M19AddActionDefaultConditions1786210886136';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`rbac_actions\` ADD \`defaultConditions\` json NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`rbac_actions\` DROP COLUMN \`defaultConditions\``,
    );
  }
}
