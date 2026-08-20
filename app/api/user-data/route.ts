import { assertSameOrigin, databaseBinding, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const row = await databaseBinding().prepare(
      "SELECT state_json AS stateJson, updated_at AS updatedAt FROM user_snapshots WHERE user_id = ?1",
    ).bind(user.id).first<{ stateJson: string; updatedAt: string }>();
    return Response.json({ state: row ? JSON.parse(row.stateJson) : null, updatedAt: row?.updatedAt ?? null }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "讀取資料失敗" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const body = await request.json() as { state?: unknown };
    if (!body.state || typeof body.state !== "object" || Array.isArray(body.state)) throw new Error("資料格式錯誤");
    const stateJson = JSON.stringify(body.state);
    if (stateJson.length > 1_000_000) throw new Error("資料量超過限制");
    await databaseBinding().prepare(
      `INSERT INTO user_snapshots (user_id, state_json, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET state_json = excluded.state_json, updated_at = CURRENT_TIMESTAMP`,
    ).bind(user.id, stateJson).run();
    return Response.json({ ok: true, savedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "儲存資料失敗";
    return Response.json({ error: message }, { status: message.includes("登入") ? 401 : 400 });
  }
}
