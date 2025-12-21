import crypto from "crypto";

export type SessionRole = "admin" | "member";

export type SessionPayload = {
  role: SessionRole;
  iat: number;
};

export const SESSION_COOKIE_NAME = "fxlocus_session";

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function signSession(payload: SessionPayload, secret: string) {
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifySession(value: string | undefined, secret: string): SessionPayload | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;

  const expected = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
  if (sig.length !== expected.length) return null;
  const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!ok) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as SessionPayload;
    if (payload.role !== "admin" && payload.role !== "member") return null;
    if (typeof payload.iat !== "number") return null;
    return payload;
  } catch {
    return null;
  }
}

