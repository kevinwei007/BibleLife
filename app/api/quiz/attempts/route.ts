import { assertSameOrigin, databaseBinding, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const body = await request.json() as { templateCode?: unknown; score?: unknown; totalQuestions?: unknown };
    if (typeof body.templateCode !== "string" || body.templateCode.length > 80) throw new Error("測驗識別資料錯誤");
    if (!Number.isInteger(body.score) || !Number.isInteger(body.totalQuestions)) throw new Error("測驗成績格式錯誤");
    const score = Number(body.score);
    const totalQuestions = Number(body.totalQuestions);
    if (score < 0 || totalQuestions < 1 || totalQuestions > 20 || score > totalQuestions) throw new Error("測驗成績超出範圍");
    await databaseBinding().prepare(
      `INSERT INTO quiz_attempts (user_id, template_code, score, total_questions, status, submitted_at)
       VALUES (?1, ?2, ?3, ?4, 'submitted', CURRENT_TIMESTAMP)`,
    ).bind(user.id, body.templateCode, score, totalQuestions).run();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "無法保存測驗成績" }, { status: 400 });
  }
}
