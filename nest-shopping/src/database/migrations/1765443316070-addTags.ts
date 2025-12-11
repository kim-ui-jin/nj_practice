import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTags1765443316070 implements MigrationInterface {
    name = 'AddTags1765443316070'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tags\` (\`seq\` int NOT NULL AUTO_INCREMENT, \`tagName\` varchar(50) NOT NULL, UNIQUE INDEX \`IDX_a0e006b29d7876b2f5a4df70a3\` (\`tagName\`), PRIMARY KEY (\`seq\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`product_tags\` (\`product_seq\` int NOT NULL, \`tag_seq\` int NOT NULL, INDEX \`IDX_4341690e8a46690d8cebc6f0b2\` (\`product_seq\`), INDEX \`IDX_cba331d4795775d84499223750\` (\`tag_seq\`), PRIMARY KEY (\`product_seq\`, \`tag_seq\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`product_tags\` ADD CONSTRAINT \`FK_4341690e8a46690d8cebc6f0b2d\` FOREIGN KEY (\`product_seq\`) REFERENCES \`products\`(\`seq\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`product_tags\` ADD CONSTRAINT \`FK_cba331d4795775d84499223750e\` FOREIGN KEY (\`tag_seq\`) REFERENCES \`tags\`(\`seq\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`product_tags\` DROP FOREIGN KEY \`FK_cba331d4795775d84499223750e\``);
        await queryRunner.query(`ALTER TABLE \`product_tags\` DROP FOREIGN KEY \`FK_4341690e8a46690d8cebc6f0b2d\``);
        await queryRunner.query(`DROP INDEX \`IDX_cba331d4795775d84499223750\` ON \`product_tags\``);
        await queryRunner.query(`DROP INDEX \`IDX_4341690e8a46690d8cebc6f0b2\` ON \`product_tags\``);
        await queryRunner.query(`DROP TABLE \`product_tags\``);
        await queryRunner.query(`DROP INDEX \`IDX_a0e006b29d7876b2f5a4df70a3\` ON \`tags\``);
        await queryRunner.query(`DROP TABLE \`tags\``);
    }

}
