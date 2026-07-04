ALTER TABLE "guests" ADD COLUMN "email" TEXT;
ALTER TABLE "guests" ADD COLUMN "phone" TEXT;
UPDATE "guests" SET "email" = "contact" WHERE "email" IS NULL;
ALTER TABLE "guests" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "guests" DROP COLUMN "contact";
