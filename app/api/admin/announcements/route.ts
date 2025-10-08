import { NextResponse } from "next/server";
import { addAnnouncement } from "@/lib/announcements";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return auth.response;
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
