import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveBannedFromUserStatus1765264737849 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users
            MODIFY COLUMN status ENUM('ACTIVE', 'INACTIVE')
            NOT NULL
            DEFAULT 'ACTIVE'; 
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users
            MODIFY COLUMN status ENUM('ACTIVE', 'INACTIVE', 'BANNED')
            NOT NULL
            DEFAULT 'ACTIVE'; 
        `);
    }

}
