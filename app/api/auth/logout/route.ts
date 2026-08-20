import { assertSameOrigin, deleteSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const cookie = await deleteSession(request);
    return Response.json({ ok: true }, { headers: { "Set-Cookie": cookie, "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "登出失敗" }, { status: 400 });
  }
}
