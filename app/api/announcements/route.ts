import { NextResponse } from "next/server";
import { getAnnouncements } from "@/lib/announcements";

export async function GET() {
  const announcements = await getAnnouncements();
  return NextResponse.json({ announcements });
}
