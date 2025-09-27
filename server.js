const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const db = require("./db");

const app = express();
app.use(bodyParser.json());

// serve static site
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ---- helpers ----
const URL_REGEX = /((https?:\/\/)|(\bwww\.)|([a-z0-9-]+\.[a-z]{2,})(\/|\b))/i;
function rejectLinks(text) {
  if (URL_REGEX.test(text)) return true;
  const obf = /([a-z0-9-]+)\s*(\[|\(|\{)?\s*(dot|\.|d0t)\s*(\]|\)|\})?\s*[a-z]{2,}/i;
  return obf.test(text);
}

// ---- routes ----

// signup: create-or-return existing user (no separate login needed)
app.post("/signup", (req, res) => {
  const { username, email } = req.body || {};
  if (!username || !email) return res.status(400).json({ error: "username and email required" });
  if (username.length > 18) return res.status(400).json({ error: "username too long" });

  const u = username.trim(), e = email.trim();
  // check if user exists by username OR email
  db.get("SELECT id, username, email FROM users WHERE username = ? OR email = ? LIMIT 1", [u, e], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.json(row); // return existing user

    // create new
    const stmt = db.prepare("INSERT INTO users (username, email) VALUES (?, ?)");
    stmt.run([u, e], function (err2) {
      if (err2) return res.status(400).json({ error: err2.message });
      res.json({ id: this.lastID, username: u, email: e });
    });
  });
});

// create post (500 chars, text-only, no links)
app.post("/post", (req, res) => {
  const { user_id, content } = req.body || {};
  if (!user_id || !content) return res.status(400).json({ error: "user_id and content required" });
  const trimmed = String(content).trim();
  if (trimmed.length === 0 || trimmed.length > 500) return res.status(400).json({ error: "content must be 1–500 chars" });
  if (rejectLinks(trimmed)) return res.status(400).json({ error: "no links allowed" });

  const stmt = db.prepare("INSERT INTO posts (user_id, content) VALUES (?, ?)");
  stmt.run([user_id, trimmed], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID, content: trimmed });
  });
});

// global feed
app.get("/feed/global", (_req, res) => {
  db.all(
    `SELECT posts.id, users.username, posts.content, posts.created_at
     FROM posts
     JOIN users ON users.id = posts.user_id
     ORDER BY posts.created_at DESC
     LIMIT 100`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// follow / unfollow
app.post("/follow", (req, res) => {
  const { follower_id, following_id } = req.body || {};
  if (!follower_id || !following_id) return res.status(400).json({ error: "follower_id and following_id required" });
  const stmt = db.prepare("INSERT INTO follows (follower_id, following_id) VALUES (?, ?)");
  stmt.run([follower_id, following_id], (err) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post("/unfollow", (req, res) => {
  const { follower_id, following_id } = req.body || {};
  if (!follower_id || !following_id) return res.status(400).json({ error: "follower_id and following_id required" });
  const stmt = db.prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?");
  stmt.run([follower_id, following_id], (err) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ success: true });
  });
});

// block
app.post("/block", (req, res) => {
  const { blocker_id, blocked_id } = req.body || {};
  if (!blocker_id || !blocked_id) return res.status(400).json({ error: "blocker_id and blocked_id required" });
  const stmt = db.prepare("INSERT INTO blocks (blocker_id, blocked_id) VALUES (?, ?)");
  stmt.run([blocker_id, blocked_id], (err) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ success: true });
  });
});

// home feed (followed only, excluding blocked)
app.get("/feed/home/:user_id", (req, res) => {
  const { user_id } = req.params;
  db.all(
    `SELECT p.id, u.username, p.content, p.created_at
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
       AND p.user_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?)
     ORDER BY p.created_at DESC
     LIMIT 100`,
    [user_id, user_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`7scape running on :${PORT}`));