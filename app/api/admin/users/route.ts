import { assertSameOrigin, databaseBinding, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const result = await databaseBinding().prepare(
      `SELECT id, email, display_name AS displayName, avatar_url AS avatarUrl, role,
              created_at AS createdAt, last_login_at AS lastLoginAt
       FROM users ORDER BY created_at DESC LIMIT 500`,
    ).all();
    return Response.json({ users: result.results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "讀取帳號失敗" }, { status: 403 });
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin(request);
    const body = await request.json() as { userId?: unknown };
    if (typeof body.userId !== "string" || !body.userId) throw new Error("缺少使用者識別碼");
    if (body.userId === admin.id) throw new Error("不能刪除目前登入的管理員帳號");
    const target = await databaseBinding().prepare("SELECT id, role FROM users WHERE id = ?1").bind(body.userId).first<{ id: string; role: string }>();
    if (!target) throw new Error("找不到使用者");
    if (target.role === "admin") throw new Error("不能從這裡刪除其他管理員");
    await databaseBinding().prepare("DELETE FROM users WHERE id = ?1").bind(body.userId).run();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "刪除帳號失敗" }, { status: 400 });
  }
}
