import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryToProduct1787227573000 implements MigrationInterface {
    name = 'AddCategoryToProduct1787227573000'

    // Fixed ids so the seeded rows are reproducible across environments.
    private readonly categoryIds = {
        foodDrink: '11111111-1111-4111-8111-111111111111',
        sweetsSnacks: '22222222-2222-4222-8222-222222222222',
        luxurySpecial: '33333333-3333-4333-8333-333333333333',
        hygiene: '44444444-4444-4444-8444-444444444444',
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL, "name" text NOT NULL, "sortOrder" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_categories_id" PRIMARY KEY ("id"))`);

        await queryRunner.query(
            `INSERT INTO "categories" ("id", "name", "sortOrder") VALUES
                ('${this.categoryIds.foodDrink}', 'Essen/Trinken', 0),
                ('${this.categoryIds.sweetsSnacks}', 'Süßes/Snacks', 1),
                ('${this.categoryIds.luxurySpecial}', 'Luxus/Besonderes', 2),
                ('${this.categoryIds.hygiene}', 'Hygiene', 3)`
        );

        // Add nullable first so existing rows can be backfilled before the
        // NOT NULL constraint is enforced.
        await queryRunner.query(`ALTER TABLE "products" ADD "categoryId" uuid`);

        // MVP backfill: all existing products default to "Essen/Trinken".
        // Wrong assignments can simply be corrected later via SQL, since
        // category maintenance for the MVP happens directly in the database.
        await queryRunner.query(`UPDATE "products" SET "categoryId" = '${this.categoryIds.foodDrink}'`);

        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "categoryId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_products_categoryId" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_categoryId"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "categoryId"`);
        await queryRunner.query(`DROP TABLE "categories"`);
    }

}
