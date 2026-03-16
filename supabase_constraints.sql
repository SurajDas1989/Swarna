-- Paste and run this exactly into your Supabase SQL Editor

ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "check_store_credit";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "check_reserved_store_credit";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "check_available_credit";

ALTER TABLE "users" ADD CONSTRAINT "check_store_credit" CHECK ("storeCredit" >= 0);
ALTER TABLE "users" ADD CONSTRAINT "check_reserved_store_credit" CHECK ("reservedStoreCredit" >= 0);
ALTER TABLE "users" ADD CONSTRAINT "check_available_credit" CHECK ("storeCredit" - "reservedStoreCredit" >= 0);

select 'Constraints applied successfully!' as result;
