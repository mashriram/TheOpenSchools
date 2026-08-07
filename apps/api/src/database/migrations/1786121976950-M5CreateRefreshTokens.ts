import { MigrationInterface, QueryRunner } from 'typeorm';

export class M5CreateRefreshTokens1786121976950 implements MigrationInterface {
  name = 'M5CreateRefreshTokens1786121976950';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`refresh_tokens\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`personCredentialId\` varchar(36) NOT NULL, \`tokenHash\` varchar(64) NOT NULL, \`expiresAt\` timestamp NOT NULL, \`revokedAt\` timestamp NULL, UNIQUE INDEX \`IDX_c25bc63d248ca90e8dcc1d92d0\` (\`tokenHash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_tokens\` ADD CONSTRAINT \`FK_31c0b968f689504d7bdcd34fb40\` FOREIGN KEY (\`personCredentialId\`) REFERENCES \`person_credentials\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`refresh_tokens\` DROP FOREIGN KEY \`FK_31c0b968f689504d7bdcd34fb40\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_c25bc63d248ca90e8dcc1d92d0\` ON \`refresh_tokens\``,
    );
    await queryRunner.query(`DROP TABLE \`refresh_tokens\``);
  }
}
