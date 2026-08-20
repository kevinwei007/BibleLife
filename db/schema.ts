import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  timezone: text("timezone").notNull().default("Asia/Taipei"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_users_email").on(table.email)]);

export const readingCycles = sqliteTable("reading_cycles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cycleNumber: integer("cycle_number").notNull().default(1),
  startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at"),
}, (table) => [uniqueIndex("idx_reading_cycles_user_number").on(table.userId, table.cycleNumber)]);

export const chapterCompletions = sqliteTable("chapter_completions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cycleId: integer("cycle_id").notNull().references(() => readingCycles.id, { onDelete: "cascade" }),
  bookCode: text("book_code").notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  completedAt: text("completed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("idx_chapter_completions_cycle_chapter").on(table.cycleId, table.bookCode, table.chapterNumber),
  index("idx_chapter_completions_user").on(table.userId),
]);

export const favorites = sqliteTable("favorites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  versionCode: text("version_code").notNull(),
  bookCode: text("book_code").notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  verseStart: integer("verse_start").notNull(),
  verseEnd: integer("verse_end").notNull(),
  textSnapshot: text("text_snapshot").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_favorites_user_created").on(table.userId, table.createdAt)]);

export const insights = sqliteTable("insights", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  versionCode: text("version_code").notNull(),
  bookCode: text("book_code").notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  verseStart: integer("verse_start").notNull(),
  verseEnd: integer("verse_end").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_insights_user_updated").on(table.userId, table.updatedAt)]);

export const rewardLedger = sqliteTable("reward_ledger", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assetType: text("asset_type", { enum: ["xp", "coin"] }).notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("idx_reward_ledger_idempotency").on(table.idempotencyKey, table.assetType),
  index("idx_reward_ledger_user_asset").on(table.userId, table.assetType),
]);

export const quizAttempts = sqliteTable("quiz_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  templateCode: text("template_code").notNull(),
  score: integer("score"),
  totalQuestions: integer("total_questions").notNull(),
  status: text("status", { enum: ["in_progress", "submitted"] }).notNull().default("in_progress"),
  startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  submittedAt: text("submitted_at"),
}, (table) => [index("idx_quiz_attempts_user_started").on(table.userId, table.startedAt)]);
