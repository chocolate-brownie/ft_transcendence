// Test environment setup
// Sets env vars before any test module is imported

const user = process.env.POSTGRES_USER || "your_db_user";
const pass = process.env.POSTGRES_PASSWORD || "your_db_password";
const db = process.env.POSTGRES_DB || "transcendence";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "your_jwt_secret_here";

// Important: On utilise 'localhost' car Jest tourne sur ton PC, pas dans Docker
process.env.DATABASE_URL = `postgresql://${user}:${pass}@localhost:5432/${db}?schema=public`;
