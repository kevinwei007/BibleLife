import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  googleSub: text("google_sub"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  timezone: text("timezone").notNull().default("Asia/Taipei"),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("idx_users_email").on(table.email),
  uniqueIndex("idx_users_google_sub").on(table.googleSub),
  index("idx_users_role_created").on(table.role, table.createdAt),
]);

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSeenAt: text("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_sessions_user").on(table.userId),
  index("idx_sessions_expires").on(table.expiresAt),
]);

export const userSnapshots = sqliteTable("user_snapshots", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  stateJson: text("state_json").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

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

export const quizQuestions = sqliteTable("quiz_questions", {
  id: text("id").primaryKey(),
  topicCode: text("topic_code").notNull(),
  topicTitle: text("topic_title").notNull(),
  bookCodes: text("book_codes").notNull(),
  bookName: text("book_name").notNull(),
  testament: text("testament", { enum: ["舊約", "新約"] }).notNull(),
  section: text("section").notNull(),
  chapterStart: integer("chapter_start").notNull(),
  chapterEnd: integer("chapter_end").notNull(),
  questionType: text("question_type", { enum: ["經文辨識", "出處辨識", "內容理解"] }).notNull(),
  question: text("question").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation").notNull(),
  reference: text("reference").notNull(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull().default("medium"),
  status: text("status", { enum: ["active", "draft", "disabled"] }).notNull().default("active"),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_quiz_questions_status_topic").on(table.status, table.topicCode),
  index("idx_quiz_questions_status_section").on(table.status, table.section),
  index("idx_quiz_questions_status_testament").on(table.status, table.testament),
]);
