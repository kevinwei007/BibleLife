import { env } from "cloudflare:workers";

const SESSION_COOKIE = "__Host-biblelife_session";
const SESSION_DAYS = 30;
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

type RuntimeEnv = {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  ADMIN_EMAILS?: string;
};

type GoogleClaims = {
  aud: string | string[];
  email: string;
  email_verified: boolean;
  exp: number;
  iss: string;
  name?: string;
  picture?: string;
  sub: string;
};

export type SessionUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
  isAdmin: boolean;
};

function runtimeEnv() {
  return env as unknown as RuntimeEnv;
}

export function getGoogleClientId() {
  return runtimeEnv().GOOGLE_CLIENT_ID?.trim() ?? "";
}

function adminEmails() {
  return new Set((runtimeEnv().ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean));
}

function base64UrlBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function base64UrlJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlBytes(value))) as T;
}

export async function verifyGoogleCredential(credential: string): Promise<GoogleClaims> {
  const clientId = getGoogleClientId();
  if (!clientId) throw new Error("Google 登入尚未完成設定");

  const parts = credential.split(".");
  if (parts.length !== 3) throw new Error("Google 登入憑證格式錯誤");
  const header = base64UrlJson<{ alg?: string; kid?: string }>(parts[0]);
  const claims = base64UrlJson<GoogleClaims>(parts[1]);
  if (header.alg !== "RS256" || !header.kid) throw new Error("不支援的 Google 登入憑證");

  const keysResponse = await fetch(GOOGLE_JWKS_URL);
  if (!keysResponse.ok) throw new Error("暫時無法驗證 Google 登入");
  const { keys } = await keysResponse.json() as { keys: Array<JsonWebKey & { kid?: string }> };
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) throw new Error("找不到 Google 簽章金鑰");

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const validSignature = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    base64UrlBytes(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );

  const audienceMatches = Array.isArray(claims.aud) ? claims.aud.includes(clientId) : claims.aud === clientId;
  const issuerMatches = claims.iss === "accounts.google.com" || claims.iss === "https://accounts.google.com";
  if (!validSignature || !audienceMatches || !issuerMatches || claims.exp <= Date.now() / 1000) {
    throw new Error("Google 登入憑證驗證失敗");
  }
  if (!claims.sub || !claims.email || !claims.email_verified) throw new Error("Google 帳號缺少已驗證的 Email");
  return claims;
}

function cookieValue(request: Request, name: string) {
  const cookies = request.headers.get("cookie") ?? "";
  for (const item of cookies.split(";")) {
    const [key, ...rest] = item.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

async function tokenHash(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) throw new Error("拒絕跨站請求");
}

export async function createUserSession(claims: GoogleClaims) {
  const database = runtimeEnv().DB;
  const email = claims.email.toLowerCase();
  const configuredAdmin = adminEmails().has(email);
  const existing = await database.prepare(
    "SELECT id, role FROM users WHERE google_sub = ?1 OR lower(email) = ?2 LIMIT 1",
  ).bind(claims.sub, email).first<{ id: string; role: string }>();
  const userId = existing?.id ?? crypto.randomUUID();
  const role = configuredAdmin || existing?.role === "admin" ? "admin" : "user";

  if (existing) {
    await database.prepare(
      "UPDATE users SET email = ?1, google_sub = ?2, display_name = ?3, avatar_url = ?4, role = ?5, last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?6",
    ).bind(email, claims.sub, claims.name ?? null, claims.picture ?? null, role, userId).run();
  } else {
    await database.prepare(
      "INSERT INTO users (id, email, google_sub, display_name, avatar_url, role, last_login_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, CURRENT_TIMESTAMP)",
    ).bind(userId, email, claims.sub, claims.name ?? null, claims.picture ?? null, role).run();
  }

  const rawToken = crypto.randomUUID() + crypto.randomUUID();
  const hash = await tokenHash(rawToken);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await database.batch([
    database.prepare("DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP"),
    database.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?1, ?2, ?3)").bind(hash, userId, expires.toISOString()),
  ]);

  return {
    cookie: `${SESSION_COOKIE}=${encodeURIComponent(rawToken)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`,
    user: { id: userId, email, displayName: claims.name ?? null, avatarUrl: claims.picture ?? null, role, isAdmin: role === "admin" } satisfies SessionUser,
  };
}

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return null;
  const hash = await tokenHash(token);
  const row = await runtimeEnv().DB.prepare(
    `SELECT u.id, u.email, u.display_name AS displayName, u.avatar_url AS avatarUrl, u.role
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ?1 AND s.expires_at > CURRENT_TIMESTAMP LIMIT 1`,
  ).bind(hash).first<Omit<SessionUser, "isAdmin">>();
  if (!row) return null;
  const isAdmin = row.role === "admin" || adminEmails().has(row.email.toLowerCase());
  return { ...row, role: isAdmin ? "admin" : "user", isAdmin };
}

export async function requireUser(request: Request) {
  const user = await getSessionUser(request);
  if (!user) throw new Error("請先登入 Google 帳號");
  return user;
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (!user.isAdmin) throw new Error("你沒有管理員權限");
  return user;
}

export async function deleteSession(request: Request) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (token) await runtimeEnv().DB.prepare("DELETE FROM sessions WHERE token_hash = ?1").bind(await tokenHash(token)).run();
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function databaseBinding() {
  return runtimeEnv().DB;
}
