CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL CHECK(length(username) <= 18),
  email TEXT UNIQUE NOT NULL,
  trust_level TEXT DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  content TEXT NOT NULL CHECK(length(content) <= 500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id INTEGER,
  following_id INTEGER,
  PRIMARY KEY(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS blocks (
  blocker_id INTEGER,
  blocked_id INTEGER,
  PRIMARY KEY(blocker_id, blocked_id)
);