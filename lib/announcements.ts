import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { kv } from "@vercel/kv";

export type Announcement = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  highlight?: boolean;
};

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "announcements.json");
const KV_KEY = "announcements";
const kvConfigured =
  Boolean(process.env.KV_REST_API_URL) &&
  Boolean(process.env.KV_REST_API_TOKEN);
const runningOnVercel = process.env.VERCEL === "1";
let inMemoryStore: Announcement[] = [];

async function ensureDataFile() {
  try {
    await fs.access(dataFile);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(dataFile, "[]", "utf-8");
  }
}

async function readFromKv(): Promise<Announcement[] | null> {
  if (!kvConfigured) {
    return null;
  }

  try {
    const stored = await kv.get<Announcement[]>(KV_KEY);
    if (Array.isArray(stored)) {
      return stored;
    }
    return [];
  } catch (error) {
    console.error("Failed to read announcements from Vercel KV:", error);
    throw new Error("KV_READ_FAILED");
  }
}

async function writeToKv(list: Announcement[]): Promise<void> {
  if (!kvConfigured) {
    return;
  }

  try {
    await kv.set(KV_KEY, list);
  } catch (error) {
    console.error("Failed to persist announcements to Vercel KV:", error);
    throw new Error("KV_WRITE_FAILED");
  }
}

async function readFromFallback(): Promise<Announcement[]> {
  if (runningOnVercel) {
    return inMemoryStore;
  }

  await ensureDataFile();
  const content = await fs.readFile(dataFile, "utf-8");
  return JSON.parse(content) as Announcement[];
}

async function writeToFallback(list: Announcement[]): Promise<void> {
  if (runningOnVercel) {
    inMemoryStore = list;
    return;
  }

  await ensureDataFile();
  await fs.writeFile(dataFile, JSON.stringify(list, null, 2), "utf-8");
}

async function readStore(): Promise<Announcement[]> {
  if (kvConfigured) {
    const data = await readFromKv();
    if (data !== null) {
      return data;
    }
  }

  return readFromFallback();
}

async function writeStore(list: Announcement[]): Promise<void> {
  if (kvConfigured) {
    try {
      await writeToKv(list);
      return;
    } catch (error) {
      if (!runningOnVercel) {
        console.warn(
          "Falling back to local file storage after KV write failure.",
          error,
        );
      }
    }
  }

  await writeToFallback(list);
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const announcements = await readStore();
  return announcements.sort(
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
  const announcements = await readStore();
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
  await writeStore(announcements);
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
  const announcements = await readStore();
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
  await writeStore(announcements);
  return next;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const announcements = await readStore();
  const next = announcements.filter((item) => item.id !== id);
  if (next.length === announcements.length) {
    throw new Error("Announcement not found");
  }

  await writeStore(next);
}
