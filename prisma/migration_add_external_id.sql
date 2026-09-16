-- Alvo da publicação: Page ID (Facebook) ou Instagram Business Account ID.
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS "externalId" TEXT;
