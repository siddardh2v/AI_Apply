import { NextResponse } from "next/server";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function unauthorized(message = "Not signed in") {
  return NextResponse.json({ error: message }, { status: 401 });
}

/** Map any thrown error to a JSON response. Surfaces auth & API-key cases. */
export function fail(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  if (error instanceof Error && error.name === "UnauthorizedError") {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const status = /ANTHROPIC_API_KEY/.test(message) ? 503 : 500;
  console.error("[api error]", error);
  return NextResponse.json({ error: message }, { status });
}
