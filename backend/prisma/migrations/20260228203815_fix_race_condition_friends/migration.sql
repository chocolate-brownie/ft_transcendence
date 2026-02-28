CREATE UNIQUE INDEX "unique_friendship_pair"
ON "friends" (LEAST("requester_id", "addressee_id"), GREATEST("requester_id", "addressee_id"))
WHERE status IN ('PENDING', 'ACCEPTED');