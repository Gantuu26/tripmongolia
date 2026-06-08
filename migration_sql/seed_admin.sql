-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE,
    email TEXT UNIQUE,
    name TEXT,
    role TEXT DEFAULT 'user',
    avatar_url TEXT,
    password_hash TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    expires_at INTEGER NOT NULL
);

-- Insert admin users (비밀번호: Tripmongolia2026 / PBKDF2-SHA256)
INSERT OR REPLACE INTO users (id, email, name, role, password_hash) VALUES
('56117dd8-ed59-43da-862f-8ef4c2726aa9', 'gantumaidar@gmail.com', 'Admin', 'admin', '7f8d9dc20013a53745563b1cdc261495:e4dfcdd3cbbfb0b4537464f856a893b684860e60fe44be61fb908f62d0575be9'),
('5023f0f2-cccb-4890-bebb-d31fb0f4d400', 'ts.dejidlala@gmail.com', 'Admin', 'admin', '4e87f70b612b2d9923d4caae0d225c93:ca1337a9617ee8a310d8dea7d73ca37fc4d942d04f1b7b92af16cd84c053394d');
