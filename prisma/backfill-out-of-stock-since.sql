UPDATE "products"
SET "outOfStockSince" = COALESCE("updatedAt", "createdAt", NOW())
WHERE "stock" <= 0
  AND "outOfStockSince" IS NULL;
