import { NextResponse } from "next/server";
import { updateAnnouncement, deleteAnnouncement } from "@/lib/announcements";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
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

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { error: "Payload must be an object" },
      { status: 422 },
    );
  }

  const { title, body, highlight, publishedAt } = payload as {
    title?: unknown;
    body?: unknown;
    highlight?: unknown;
    publishedAt?: unknown;
  };

  if (
    title === undefined &&
    body === undefined &&
    highlight === undefined &&
    publishedAt === undefined
  ) {
    return NextResponse.json(
      { error: "At least one field must be provided" },
      { status: 422 },
    );
  }

  if (title !== undefined && typeof title !== "string") {
    return NextResponse.json(
      { error: "title must be a string" },
      { status: 422 },
    );
  }

  if (body !== undefined && typeof body !== "string") {
    return NextResponse.json(
      { error: "body must be a string" },
      { status: 422 },
    );
  }

  if (highlight !== undefined && typeof highlight !== "boolean") {
    return NextResponse.json(
      { error: "highlight must be a boolean" },
      { status: 422 },
    );
  }

  if (publishedAt !== undefined && typeof publishedAt !== "string") {
    return NextResponse.json(
      { error: "publishedAt must be a string" },
      { status: 422 },
    );
  }

  if (typeof title === "string" && title.trim().length === 0) {
    return NextResponse.json(
      { error: "title cannot be empty" },
      { status: 422 },
    );
  }

  if (typeof body === "string" && body.trim().length === 0) {
    return NextResponse.json(
      { error: "body cannot be empty" },
      { status: 422 },
    );
  }

  if (typeof publishedAt === "string" && Number.isNaN(Date.parse(publishedAt))) {
    return NextResponse.json(
      { error: "publishedAt must be a valid ISO date string" },
      { status: 422 },
    );
  }

  try {
    const updated = await updateAnnouncement(params.id, {
      title: title as string | undefined,
      body: body as string | undefined,
      highlight: highlight as boolean | undefined,
      publishedAt: publishedAt as string | undefined,
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Announcement not found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    await deleteAnnouncement(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Announcement not found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
