const express = require("express");
const bodyParser = require("body-parser");
const db = require("./db");
const app = express();
app.use(bodyParser.json());

// signup
app.post("/signup", (req, res) => {
  const { username, email } = req.body;
  db.run(
    "INSERT INTO users (username, email) VALUES (?, ?)",
    [username, email],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID, username, email });
    }
  );
});

// post text
app.post("/post", (req, res) => {
  const { user_id, content } = req.body;
  if (content.length > 500) return res.status(400).json({ error: "Too long" });
  db.run(
    "INSERT INTO posts (user_id, content) VALUES (?, ?)",
    [user_id, content],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID, content });
    }
  );
});

// global feed
app.get("/feed/global", (req, res) => {
  db.all(
    `SELECT posts.id, users.username, posts.content, posts.created_at
     FROM posts
     JOIN users ON posts.user_id = users.id
     ORDER BY posts.created_at DESC
     LIMIT 100`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// follow
app.post("/follow", (req, res) => {
  const { follower_id, following_id } = req.body;
  db.run(
    "INSERT INTO follows (follower_id, following_id) VALUES (?, ?)",
    [follower_id, following_id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// home feed (followed only)
app.get("/feed/home/:user_id", (req, res) => {
  const { user_id } = req.params;
  db.all(
    `SELECT posts.id, users.username, posts.content, posts.created_at
     FROM posts
     JOIN users ON posts.user_id = users.id
     WHERE posts.user_id IN (
       SELECT following_id FROM follows WHERE follower_id = ?
     )
     ORDER BY posts.created_at DESC
     LIMIT 100`,
    [user_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// block
app.post("/block", (req, res) => {
  const { blocker_id, blocked_id } = req.body;
  db.run(
    "INSERT INTO blocks (blocker_id, blocked_id) VALUES (?, ?)",
    [blocker_id, blocked_id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.listen(3000, () => console.log("7scape running on http://localhost:3000"));