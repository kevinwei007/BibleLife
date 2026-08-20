import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";

const database = new DatabaseSync(":memory:");
for (const file of fs.readdirSync("drizzle").filter((name) => name.endsWith(".sql")).sort()) {
  const migration = fs.readFileSync(`drizzle/${file}`, "utf8");
  for (const statement of migration.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) {
    database.exec(statement);
  }
}

console.log(JSON.stringify({
  questions: database.prepare("SELECT COUNT(*) AS count FROM quiz_questions").get().count,
  topics: database.prepare("SELECT COUNT(DISTINCT topic_code) AS count FROM quiz_questions").get().count,
  active: database.prepare("SELECT COUNT(*) AS count FROM quiz_questions WHERE status = 'active'").get().count,
  tables: database.prepare("SELECT COUNT(*) AS count FROM sqlite_schema WHERE type = 'table'").get().count,
}));
