import { SignJWT, jwtVerify } from "jose";

// Edge-safe session helpers (no Node-only deps) so middleware can use them.

export const SESSION_COOKIE = "aiapply_session";

function getSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    // Dev fallback so the app boots without configuration. Set AUTH_SECRET in
    // production — sessions signed with this default are not secure.
    "dev-insecure-secret-change-me-please-0123456789";
  return new TextEncoder().encode(secret);
}

export async function signSession(userId: string): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return typeof payload.uid === "string" ? payload.uid : null;
  } catch {
    return null;
  }
}
