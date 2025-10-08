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

type UpdateAnnouncement = {
  title?: string;
  body?: string;
  publishedAt?: string;
  highlight?: boolean;
};

export async function updateAnnouncement(
  id: string,
  updates: UpdateAnnouncement,
): Promise<Announcement> {
  await ensureDataFile();
  const announcements = await getAnnouncements();
  const index = announcements.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error("Announcement not found");
  }

  const original = announcements[index];
  const next: Announcement = {
    ...original,
    title:
      updates.title !== undefined ? updates.title.trim() : original.title,
    body: updates.body !== undefined ? updates.body.trim() : original.body,
    highlight:
      updates.highlight !== undefined ? updates.highlight : original.highlight,
    publishedAt:
      updates.publishedAt !== undefined
        ? new Date(updates.publishedAt).toISOString()
        : original.publishedAt,
  };

  announcements[index] = next;
  await fs.writeFile(dataFile, JSON.stringify(announcements, null, 2), "utf-8");
  return next;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await ensureDataFile();
  const announcements = await getAnnouncements();
  const next = announcements.filter((item) => item.id !== id);
  if (next.length === announcements.length) {
    throw new Error("Announcement not found");
  }

  await fs.writeFile(dataFile, JSON.stringify(next, null, 2), "utf-8");
}
