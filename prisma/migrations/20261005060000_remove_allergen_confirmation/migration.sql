-- Remove the "allergens confirmed by admin" gate. Allergens are still shown to customers;
-- an explicit flag now distinguishes "contains none of the 14" from "not provided".
-- Written to be safe to re-run.

-- 1. Drop the gate first so items can be switched on.
ALTER TABLE "MenuItem" DROP CONSTRAINT IF EXISTS "MenuItem_available_requires_allergens";

-- 2. New explicit flag on menu items and order snapshots.
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "noAllergens" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "noAllergens" BOOLEAN NOT NULL DEFAULT false;

-- 3. Items an admin had confirmed as containing none of the 14 keep that meaning,
--    and items switched off only because they were unconfirmed become available.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'MenuItem' AND column_name = 'allergensConfirmedAt') THEN
    UPDATE "MenuItem" SET "noAllergens" = true WHERE cardinality("allergens") = 0 AND "allergensConfirmedAt" IS NOT NULL;
    UPDATE "MenuItem" SET "isAvailable" = true WHERE "allergensConfirmedAt" IS NULL AND "isAvailable" = false AND "archivedAt" IS NULL;
  END IF;
END $$;

-- 4. Past orders: items with no allergens were only orderable once confirmed, so they meant "none".
UPDATE "OrderItem" SET "noAllergens" = true WHERE cardinality("allergens") = 0;

-- 5. Remove the confirmation columns.
ALTER TABLE "MenuItem" DROP COLUMN IF EXISTS "allergensConfirmedAt";
ALTER TABLE "MenuItem" DROP COLUMN IF EXISTS "allergensConfirmedBy";

-- 6. "None" can't coexist with listed allergens.
ALTER TABLE "MenuItem" DROP CONSTRAINT IF EXISTS "MenuItem_no_allergens_consistent";
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_no_allergens_consistent" CHECK (NOT "noAllergens" OR cardinality("allergens") = 0);
ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_no_allergens_consistent";
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_no_allergens_consistent" CHECK (NOT "noAllergens" OR cardinality("allergens") = 0);
