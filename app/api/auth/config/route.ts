import { getGoogleClientId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = getGoogleClientId();
  return Response.json({ configured: Boolean(clientId), clientId }, {
    headers: { "Cache-Control": "no-store" },
  });
}
