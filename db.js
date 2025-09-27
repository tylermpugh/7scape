const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./7scape.db");

db.serialize(() => {
  const schema = require("fs").readFileSync("./schema.sql", "utf8");
  db.exec(schema);
});

module.exports = db;