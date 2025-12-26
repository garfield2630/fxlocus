import { SignJWT, jwtVerify } from "jose";

import { ENV } from "./env";
import type { SystemRole } from "./roles";

export type SystemJwtPayload = {
  sub: string; // user_id
  sid: string; // session_id
  role: SystemRole;
};

function secretKey() {
  return new TextEncoder().encode(ENV.SYSTEM_JWT_SECRET());
}

export async function signSystemJwt(payload: SystemJwtPayload) {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secretKey());
  return jwt;
}

export async function verifySystemJwt(token: string) {
  const { payload } = await jwtVerify(token, secretKey());
  return payload as unknown as SystemJwtPayload & { exp: number; iat: number };
}
