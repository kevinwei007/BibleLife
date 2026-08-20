import { assertSameOrigin, createUserSession, verifyGoogleCredential } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (request.headers.get("x-biblelife-auth") !== "google") throw new Error("登入請求驗證失敗");
    const body = await request.json() as { credential?: unknown };
    if (typeof body.credential !== "string" || body.credential.length > 10_000) throw new Error("缺少 Google 登入憑證");
    const claims = await verifyGoogleCredential(body.credential);
    const { cookie, user } = await createUserSession(claims);
    return Response.json({ user }, { headers: { "Set-Cookie": cookie, "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "登入失敗" }, { status: 400 });
  }
}
