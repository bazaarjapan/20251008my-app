import { NextResponse } from "next/server";
import { addAnnouncement } from "@/lib/announcements";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  if (!ADMIN_TOKEN) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing ADMIN_TOKEN" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorized();
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (token !== ADMIN_TOKEN) {
    return unauthorized();
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof (payload as { title?: string }).title !== "string" ||
    typeof (payload as { body?: string }).body !== "string"
  ) {
    return NextResponse.json(
      { error: "title and body are required" },
      { status: 422 },
    );
  }

  const { title, body, publishedAt, highlight } = payload as {
    title: string;
    body: string;
    publishedAt?: string;
    highlight?: boolean;
  };

  if (title.trim().length === 0 || body.trim().length === 0) {
    return NextResponse.json(
      { error: "title and body cannot be empty" },
      { status: 422 },
    );
  }

  if (publishedAt && Number.isNaN(Date.parse(publishedAt))) {
    return NextResponse.json(
      { error: "publishedAt must be a valid ISO date string" },
      { status: 422 },
    );
  }

  const entry = await addAnnouncement({ title, body, publishedAt, highlight });
  return NextResponse.json(entry, { status: 201 });
}
