import { MigrationInterface, QueryRunner } from 'typeorm';

export class M2CreateRbacTables1786119356061 implements MigrationInterface {
  name = 'M2CreateRbacTables1786119356061';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`rbac_modules\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`name\` varchar(60) NOT NULL, \`description\` text NOT NULL, \`category\` varchar(20) NOT NULL, \`type\` varchar(16) NOT NULL DEFAULT 'Core', \`version\` varchar(20) NULL, \`active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_89e1f15572991e7c798024267f\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`rbac_roles\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`schoolId\` varchar(36) NOT NULL, \`category\` varchar(16) NOT NULL, \`name\` varchar(40) NOT NULL, \`shortName\` varchar(8) NOT NULL, \`description\` varchar(120) NOT NULL, \`type\` varchar(16) NOT NULL DEFAULT 'Core', \`canLogin\` tinyint NOT NULL DEFAULT 1, \`futureYearsLogin\` tinyint NOT NULL DEFAULT 1, \`pastYearsLogin\` tinyint NOT NULL DEFAULT 1, \`restriction\` varchar(16) NOT NULL DEFAULT 'None', UNIQUE INDEX \`IDX_76607e6b8e3c6a3ae1594950f1\` (\`schoolId\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`rbac_permissions\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`roleId\` varchar(36) NOT NULL, \`actionId\` varchar(36) NOT NULL, \`conditions\` json NULL, UNIQUE INDEX \`IDX_a0717c8c0d356188f81f96ff17\` (\`roleId\`, \`actionId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`rbac_actions\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`moduleId\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`category\` varchar(40) NOT NULL, \`description\` varchar(255) NOT NULL, \`helpUrl\` varchar(255) NULL, \`precedence\` int NOT NULL DEFAULT '0', \`entrySidebar\` tinyint NOT NULL DEFAULT 1, \`menuShow\` tinyint NOT NULL DEFAULT 1, \`verb\` varchar(40) NOT NULL, \`subject\` varchar(60) NOT NULL, \`defaultPermissionAdmin\` tinyint NOT NULL DEFAULT 0, \`defaultPermissionTeacher\` tinyint NOT NULL DEFAULT 0, \`defaultPermissionStudent\` tinyint NOT NULL DEFAULT 0, \`defaultPermissionParent\` tinyint NOT NULL DEFAULT 0, \`defaultPermissionSupport\` tinyint NOT NULL DEFAULT 0, \`categoryPermissionStaff\` tinyint NOT NULL DEFAULT 1, \`categoryPermissionStudent\` tinyint NOT NULL DEFAULT 1, \`categoryPermissionParent\` tinyint NOT NULL DEFAULT 1, \`categoryPermissionOther\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_8e1c6b9addaca2846210059d34\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`school_module_enablements\` (\`id\` varchar(36) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`schoolId\` varchar(36) NOT NULL, \`moduleId\` varchar(36) NOT NULL, \`enabled\` tinyint NOT NULL DEFAULT 1, \`enabledAt\` timestamp NULL, UNIQUE INDEX \`IDX_23a880a9de3a4fa6c95bd0bd4e\` (\`schoolId\`, \`moduleId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`rbac_roles\` ADD CONSTRAINT \`FK_49d4d53cf1cd1c9d7f90ce22e65\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`rbac_permissions\` ADD CONSTRAINT \`FK_fe4a5ceacf5c1254460db3dff93\` FOREIGN KEY (\`roleId\`) REFERENCES \`rbac_roles\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`rbac_permissions\` ADD CONSTRAINT \`FK_cbfa6dc1091be312d52e9a196e2\` FOREIGN KEY (\`actionId\`) REFERENCES \`rbac_actions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`rbac_actions\` ADD CONSTRAINT \`FK_8c22dfa56418b57f135188f3d24\` FOREIGN KEY (\`moduleId\`) REFERENCES \`rbac_modules\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`school_module_enablements\` ADD CONSTRAINT \`FK_e196020e42d66216df597393e36\` FOREIGN KEY (\`schoolId\`) REFERENCES \`schools\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`school_module_enablements\` ADD CONSTRAINT \`FK_962d1d343018f1a0d2d13f82c29\` FOREIGN KEY (\`moduleId\`) REFERENCES \`rbac_modules\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`school_module_enablements\` DROP FOREIGN KEY \`FK_962d1d343018f1a0d2d13f82c29\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`school_module_enablements\` DROP FOREIGN KEY \`FK_e196020e42d66216df597393e36\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`rbac_actions\` DROP FOREIGN KEY \`FK_8c22dfa56418b57f135188f3d24\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`rbac_permissions\` DROP FOREIGN KEY \`FK_cbfa6dc1091be312d52e9a196e2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`rbac_permissions\` DROP FOREIGN KEY \`FK_fe4a5ceacf5c1254460db3dff93\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`rbac_roles\` DROP FOREIGN KEY \`FK_49d4d53cf1cd1c9d7f90ce22e65\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_23a880a9de3a4fa6c95bd0bd4e\` ON \`school_module_enablements\``,
    );
    await queryRunner.query(`DROP TABLE \`school_module_enablements\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_8e1c6b9addaca2846210059d34\` ON \`rbac_actions\``,
    );
    await queryRunner.query(`DROP TABLE \`rbac_actions\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_a0717c8c0d356188f81f96ff17\` ON \`rbac_permissions\``,
    );
    await queryRunner.query(`DROP TABLE \`rbac_permissions\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_76607e6b8e3c6a3ae1594950f1\` ON \`rbac_roles\``,
    );
    await queryRunner.query(`DROP TABLE \`rbac_roles\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_89e1f15572991e7c798024267f\` ON \`rbac_modules\``,
    );
    await queryRunner.query(`DROP TABLE \`rbac_modules\``);
  }
}
