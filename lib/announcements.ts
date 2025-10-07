import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type Announcement = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  highlight?: boolean;
};

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "announcements.json");

async function ensureDataFile() {
  try {
    await fs.access(dataFile);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(dataFile, "[]", "utf-8");
  }
}

export async function getAnnouncements(): Promise<Announcement[]> {
  await ensureDataFile();
  const content = await fs.readFile(dataFile, "utf-8");
  const parsed = JSON.parse(content) as Announcement[];
  return parsed.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

type NewAnnouncement = {
  title: string;
  body: string;
  publishedAt?: string;
  highlight?: boolean;
};

export async function addAnnouncement(
  payload: NewAnnouncement,
): Promise<Announcement> {
  await ensureDataFile();
  const announcements = await getAnnouncements();
  const now = new Date();
  const entry: Announcement = {
    id: randomUUID(),
    title: payload.title.trim(),
    body: payload.body.trim(),
    highlight: payload.highlight ?? false,
    publishedAt:
      payload.publishedAt !== undefined
        ? new Date(payload.publishedAt).toISOString()
        : now.toISOString(),
  };

  announcements.unshift(entry);
  await fs.writeFile(dataFile, JSON.stringify(announcements, null, 2), "utf-8");
  return entry;
}
