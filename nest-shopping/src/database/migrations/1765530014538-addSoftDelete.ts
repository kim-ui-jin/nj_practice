import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDelete1765530014538 implements MigrationInterface {
    name = 'AddSoftDelete1765530014538'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`deletedAt\` datetime(6) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`deletedAt\``);
    }

}
