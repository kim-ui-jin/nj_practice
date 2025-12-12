import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteTwo1765530707058 implements MigrationInterface {
    name = 'AddSoftDeleteTwo1765530707058'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` MODIFY \`deletedAt\` datetime(0) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`deletedAt\``);
    }

}
