import { NextResponse } from "next/server";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

type AdminCheck =
  | { authorized: true }
  | { authorized: false; response: NextResponse };

export function requireAdmin(request: Request): AdminCheck {
  if (!ADMIN_TOKEN) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Server misconfiguration: missing ADMIN_TOKEN" },
        { status: 500 },
      ),
    };
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (token !== ADMIN_TOKEN) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { authorized: true };
}
