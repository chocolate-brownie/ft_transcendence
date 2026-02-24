-- Set existing NULL avatar_url values to the default before making column NOT NULL
UPDATE "users" SET "avatar_url" = '/uploads/avatars/default.png' WHERE "avatar_url" IS NULL;

-- Make avatar_url non-nullable and set a default for new rows
ALTER TABLE "users" ALTER COLUMN "avatar_url" SET DEFAULT '/uploads/avatars/default.png';
ALTER TABLE "users" ALTER COLUMN "avatar_url" SET NOT NULL;
