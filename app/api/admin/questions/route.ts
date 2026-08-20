import { assertSameOrigin, databaseBinding, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const statuses = new Set(["active", "draft", "disabled"]);
const difficulties = new Set(["easy", "medium", "hard"]);
const questionTypes = new Set(["經文辨識", "出處辨識", "內容理解"]);

type QuestionPayload = {
  id?: unknown;
  topicCode?: unknown;
  topicTitle?: unknown;
  bookCodes?: unknown;
  bookName?: unknown;
  testament?: unknown;
  section?: unknown;
  chapterStart?: unknown;
  chapterEnd?: unknown;
  questionType?: unknown;
  question?: unknown;
  options?: unknown;
  correctIndex?: unknown;
  explanation?: unknown;
  reference?: unknown;
  difficulty?: unknown;
  status?: unknown;
};

function requiredText(value: unknown, label: string, maxLength = 600) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) throw new Error(`${label}格式不正確`);
  return value.trim();
}

function parsePayload(body: QuestionPayload) {
  const options = Array.isArray(body.options) ? body.options.map((item) => requiredText(item, "選項", 300)) : [];
  if (options.length !== 4 || new Set(options).size !== 4) throw new Error("必須提供四個不重複的選項");
  const correctIndex = Number(body.correctIndex);
  const chapterStart = Number(body.chapterStart);
  const chapterEnd = Number(body.chapterEnd);
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) throw new Error("正確答案設定錯誤");
  if (!Number.isInteger(chapterStart) || !Number.isInteger(chapterEnd) || chapterStart < 1 || chapterEnd < chapterStart || chapterEnd > 150) throw new Error("章節範圍錯誤");
  const status = requiredText(body.status, "狀態", 20);
  const difficulty = requiredText(body.difficulty, "難度", 20);
  const questionType = requiredText(body.questionType, "題型", 20);
  if (!statuses.has(status) || !difficulties.has(difficulty) || !questionTypes.has(questionType)) throw new Error("題目分類設定錯誤");
  const testament = requiredText(body.testament, "約別", 10);
  if (testament !== "舊約" && testament !== "新約") throw new Error("約別設定錯誤");
  return {
    topicCode: requiredText(body.topicCode, "測驗卷代碼", 20),
    topicTitle: requiredText(body.topicTitle, "測驗卷名稱", 100),
    bookCodes: requiredText(body.bookCodes, "書卷代碼", 40),
    bookName: requiredText(body.bookName, "書卷名稱", 50),
    testament,
    section: requiredText(body.section, "主題分類", 40),
    chapterStart,
    chapterEnd,
    questionType,
    question: requiredText(body.question, "題目", 600),
    options,
    correctIndex,
    explanation: requiredText(body.explanation, "解說", 800),
    reference: requiredText(body.reference, "經文依據", 100),
    difficulty,
    status,
  };
}

const selectSql = `SELECT id, topic_code AS topicCode, topic_title AS topicTitle, book_codes AS bookCodes,
  book_name AS bookName, testament, section, chapter_start AS chapterStart, chapter_end AS chapterEnd,
  question_type AS questionType, question, option_a AS optionA, option_b AS optionB,
  option_c AS optionC, option_d AS optionD, correct_index AS correctIndex, explanation,
  reference, difficulty, status, created_at AS createdAt, updated_at AS updatedAt
  FROM quiz_questions`;

function normalizeQuestion(row: Record<string, unknown>) {
  const { optionA, optionB, optionC, optionD, ...question } = row;
  return { ...question, options: [optionA, optionB, optionC, optionD] };
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const result = await databaseBinding().prepare(`${selectSql} ORDER BY CAST(topic_code AS INTEGER), topic_code, id LIMIT 750`).all();
    return Response.json({ questions: result.results.map((row) => normalizeQuestion(row as Record<string, unknown>)) }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "無法讀取題庫" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin(request);
    const question = parsePayload(await request.json() as QuestionPayload);
    const id = crypto.randomUUID();
    await databaseBinding().prepare(
      `INSERT INTO quiz_questions (id, topic_code, topic_title, book_codes, book_name, testament, section,
        chapter_start, chapter_end, question_type, question, option_a, option_b, option_c, option_d,
        correct_index, explanation, reference, difficulty, status, created_by, updated_by)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?21)`,
    ).bind(id, question.topicCode, question.topicTitle, question.bookCodes, question.bookName, question.testament,
      question.section, question.chapterStart, question.chapterEnd, question.questionType, question.question,
      ...question.options, question.correctIndex, question.explanation, question.reference, question.difficulty,
      question.status, admin.id).run();
    const row = await databaseBinding().prepare(`${selectSql} WHERE id = ?1`).bind(id).first<Record<string, unknown>>();
    return Response.json({ question: row ? normalizeQuestion(row) : null });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "新增題目失敗" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin(request);
    const body = await request.json() as QuestionPayload;
    const id = requiredText(body.id, "題目 ID", 80);
    const question = parsePayload(body);
    const result = await databaseBinding().prepare(
      `UPDATE quiz_questions SET topic_code = ?1, topic_title = ?2, book_codes = ?3, book_name = ?4,
        testament = ?5, section = ?6, chapter_start = ?7, chapter_end = ?8, question_type = ?9,
        question = ?10, option_a = ?11, option_b = ?12, option_c = ?13, option_d = ?14,
        correct_index = ?15, explanation = ?16, reference = ?17, difficulty = ?18, status = ?19,
        updated_by = ?20, updated_at = CURRENT_TIMESTAMP WHERE id = ?21`,
    ).bind(question.topicCode, question.topicTitle, question.bookCodes, question.bookName, question.testament,
      question.section, question.chapterStart, question.chapterEnd, question.questionType, question.question,
      ...question.options, question.correctIndex, question.explanation, question.reference, question.difficulty,
      question.status, admin.id, id).run();
    if (!result.meta.changes) throw new Error("找不到指定題目");
    const row = await databaseBinding().prepare(`${selectSql} WHERE id = ?1`).bind(id).first<Record<string, unknown>>();
    return Response.json({ question: row ? normalizeQuestion(row) : null });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "更新題目失敗" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    await requireAdmin(request);
    const body = await request.json() as { id?: unknown };
    const id = requiredText(body.id, "題目 ID", 80);
    const result = await databaseBinding().prepare("DELETE FROM quiz_questions WHERE id = ?1").bind(id).run();
    if (!result.meta.changes) throw new Error("找不到指定題目");
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "刪除題目失敗" }, { status: 400 });
  }
}
