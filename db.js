const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "7scape.db");
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  db.exec(schema);
});

module.exports = db;