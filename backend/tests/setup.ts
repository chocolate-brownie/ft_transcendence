// Test environment setup
// Sets env vars before any test module is imported

const user = process.env.POSTGRES_USER || 'transcendence_user';
const pass = process.env.POSTGRES_PASSWORD || 'tr4nsc3nd3nc3_s3cur3';
const db = process.env.POSTGRES_DB || 'transcendence';

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "change_me_to_a_real_secret_in_production_42";

// Important: On utilise 'localhost' car Jest tourne sur ton PC, pas dans Docker
process.env.DATABASE_URL = `postgresql://${user}:${pass}@localhost:5432/${db}?schema=public`;
