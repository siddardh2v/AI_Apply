import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/signout — clear the session cookie.
export async function POST() {
  try {
    cookies().delete(SESSION_COOKIE);
    return ok({ signedOut: true });
  } catch (e) {
    return fail(e);
  }
}
