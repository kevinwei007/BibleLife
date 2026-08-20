import { databaseBinding } from "@/lib/auth";

export const dynamic = "force-dynamic";

const modes = new Set(["topic", "mixed", "theme"]);
const scopes = new Set(["ALL", "OT", "NT"]);
const sections = new Set(["pentateuch", "history", "poetry", "major_prophets", "minor_prophets", "gospels", "acts", "pauline", "general_epistles", "prophecy"]);

type QuestionRow = {
  id: string;
  topicCode: string;
  topicTitle: string;
  bookName: string;
  testament: string;
  section: string;
  questionType: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctIndex: number;
  explanation: string;
  reference: string;
  difficulty: string;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") ?? "topic";
    if (!modes.has(mode)) throw new Error("不支援的測驗模式");
    const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit")) || 5));
    let where = "status = 'active'";
    const bindings: unknown[] = [];

    if (mode === "topic") {
      const topicCode = url.searchParams.get("topicCode") ?? "";
      if (!/^\d{1,2}(?:-\d)?$/.test(topicCode)) throw new Error("請選擇測驗卷範圍");
      where += " AND topic_code = ?1";
      bindings.push(topicCode);
    } else if (mode === "theme") {
      const section = url.searchParams.get("section") ?? "";
      if (!sections.has(section)) throw new Error("請選擇主題分類");
      where += " AND section = ?1";
      bindings.push(section);
    } else {
      const scope = url.searchParams.get("scope") ?? "ALL";
      if (!scopes.has(scope)) throw new Error("不支援的綜合測驗範圍");
      if (scope !== "ALL") {
        where += " AND testament = ?1";
        bindings.push(scope === "OT" ? "舊約" : "新約");
      }
    }

    const limitPlaceholder = `?${bindings.length + 1}`;
    const result = await databaseBinding().prepare(
      `SELECT id, topic_code AS topicCode, topic_title AS topicTitle, book_name AS bookName,
              testament, section, question_type AS questionType, question,
              option_a AS optionA, option_b AS optionB, option_c AS optionC, option_d AS optionD,
              correct_index AS correctIndex, explanation, reference, difficulty
       FROM quiz_questions WHERE ${where} ORDER BY RANDOM() LIMIT ${limitPlaceholder}`,
    ).bind(...bindings, limit).all<QuestionRow>();

    const questions = result.results.map((item) => ({
      id: item.id,
      topicCode: item.topicCode,
      topicTitle: item.topicTitle,
      bookName: item.bookName,
      testament: item.testament,
      section: item.section,
      questionType: item.questionType,
      question: item.question,
      options: [item.optionA, item.optionB, item.optionC, item.optionD],
      correctIndex: item.correctIndex,
      explanation: item.explanation,
      reference: item.reference,
      difficulty: item.difficulty,
    }));
    if (!questions.length) throw new Error("這個範圍目前沒有已發布題目");
    return Response.json({ questions }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "無法產生測驗" }, { status: 400 });
  }
}
