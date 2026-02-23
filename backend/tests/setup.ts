// Test environment setup
// Sets env vars before any test module is imported

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-for-jest";
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://localhost:5432/test";
