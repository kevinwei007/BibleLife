import { databaseBinding } from "@/lib/auth";

export const dynamic = "force-dynamic";

const sectionLabels: Record<string, string> = {
  pentateuch: "摩西五經",
  history: "歷史書",
  poetry: "詩歌智慧書",
  major_prophets: "大先知書",
  minor_prophets: "小先知書",
  gospels: "四福音書",
  acts: "使徒行傳",
  pauline: "保羅書信",
  general_epistles: "普通書信",
  prophecy: "啟示文學",
};

export async function GET() {
  try {
    const database = databaseBinding();
    const [topicResult, sectionResult, totalResult] = await Promise.all([
      database.prepare(
        `SELECT topic_code AS code, topic_title AS title, book_name AS bookName,
                testament, MIN(chapter_start) AS chapterStart, MAX(chapter_end) AS chapterEnd,
                COUNT(*) AS questionCount
         FROM quiz_questions WHERE status = 'active'
         GROUP BY topic_code, topic_title, book_name, testament
         ORDER BY CAST(topic_code AS INTEGER), topic_code`,
      ).all(),
      database.prepare(
        `SELECT section AS code, COUNT(*) AS questionCount
         FROM quiz_questions WHERE status = 'active'
         GROUP BY section ORDER BY section`,
      ).all(),
      database.prepare("SELECT COUNT(*) AS count FROM quiz_questions WHERE status = 'active'").first<{ count: number }>(),
    ]);

    const themes = sectionResult.results.map((item) => ({
      ...item,
      label: sectionLabels[String(item.code)] ?? String(item.code),
    }));
    return Response.json({ topics: topicResult.results, themes, totalQuestions: totalResult?.count ?? 0 }, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "無法讀取題庫目錄" }, { status: 500 });
  }
}
