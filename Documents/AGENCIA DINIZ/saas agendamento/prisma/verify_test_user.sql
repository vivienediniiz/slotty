-- Verify email for test user
-- Execute in Supabase SQL Editor

UPDATE "users"
SET "emailVerified" = CURRENT_TIMESTAMP
WHERE email = 'teste@slotty.com';
