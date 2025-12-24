import crypto from "crypto";

import { ENV } from "./env";

export type CodePurpose = "login" | "reset";

export function generate6DigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function normalizeIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  return isEmail ? trimmed.toLowerCase() : trimmed;
}

export function qualifyIdentifier(purpose: CodePurpose, identifier: string) {
  return `${purpose}:${normalizeIdentifier(identifier)}`;
}

export function hashCode(code: string) {
  const pepper = ENV.SYSTEM_JWT_SECRET();
  return crypto
    .createHash("sha256")
    .update(`${code}:${pepper}`)
    .digest("hex");
}

export function isEmail(identifier: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
}

export function isPhoneLike(identifier: string) {
  const digits = identifier.replace(/[^\d+]/g, "");
  return digits.length >= 8 && digits.length <= 20;
}

export async function sendLoginCodeEmail(to: string, code: string, purpose: CodePurpose) {
  const apiKey = ENV.RESEND_API_KEY();
  if (!apiKey) return { ok: false as const, reason: "RESEND_NOT_CONFIGURED" as const };

  const subject =
    purpose === "reset" ? "FxLocus password reset code" : "FxLocus login code";

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.6">
      <h2 style="margin:0 0 12px">FxLocus</h2>
      <p style="margin:0 0 12px">Your ${purpose === "reset" ? "password reset" : "login"} code:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:12px 0">${code}</div>
      <p style="margin:0;color:#6b7280">Valid for 5 minutes. If you didn't request this, you can ignore this email.</p>
    </div>
  `.trim();

  const from = process.env.RESEND_FROM || "FxLocus <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html
    })
  });

  if (!res.ok) {
    return { ok: false as const, reason: "RESEND_FAILED" as const };
  }

  return { ok: true as const };
}

