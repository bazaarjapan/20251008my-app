import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return auth.response;
  }

  return NextResponse.json({ ok: true });
}
