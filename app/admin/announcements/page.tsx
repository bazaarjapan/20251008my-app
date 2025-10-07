"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Announcement = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  highlight?: boolean;
};

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [highlight, setHighlight] = useState(false);
  const [publishedAt, setPublishedAt] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const isFormDisabled = useMemo(
    () =>
      status.kind === "loading" ||
      title.trim().length === 0 ||
      body.trim().length === 0 ||
      token.trim().length === 0,
    [status.kind, title, body, token],
  );

  useEffect(() => {
    void refreshAnnouncements();
  }, []);

  async function refreshAnnouncements() {
    try {
      const res = await fetch("/api/announcements", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status}`);
      }
      const json = (await res.json()) as { announcements: Announcement[] };
      setAnnouncements(json.announcements);
    } catch (error) {
      console.error(error);
      setStatus({
        kind: "error",
        message: "お知らせ一覧の取得に失敗しました。",
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "loading" });

    const payload: {
      title: string;
      body: string;
      highlight: boolean;
      publishedAt?: string;
    } = {
      title,
      body,
      highlight,
    };

    if (publishedAt.trim().length > 0) {
      const isoDate = new Date(publishedAt).toISOString();
      payload.publishedAt = isoDate;
    }

    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const detail = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(detail?.error ?? `投稿に失敗しました (${res.status})`);
      }

      setTitle("");
      setBody("");
      setHighlight(false);
      setPublishedAt("");
      setStatus({ kind: "success", message: "お知らせを投稿しました。" });
      await refreshAnnouncements();
    } catch (error) {
      console.error(error);
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "お知らせの投稿に失敗しました。",
      });
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-8">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            管理者用お知らせ投稿
          </h1>
          <p className="text-sm text-slate-300 sm:text-base">
            環境変数 <code className="rounded bg-slate-800 px-2 py-1 text-xs">ADMIN_TOKEN</code>{" "}
            を設定済みの管理者のみが投稿できます。
          </p>
          <Link
            href="/"
            className="text-sm font-medium text-sky-300 hover:text-sky-200"
          >
            ホームに戻る →
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-10">
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <fieldset className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-200">
                管理者トークン
              </label>
              <input
                type="password"
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/50"
                placeholder="環境変数 ADMIN_TOKEN の値を入力"
                value={token}
                onChange={(event) => setToken(event.target.value)}
              />
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-200">
                タイトル
              </label>
              <input
                type="text"
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/50"
                placeholder="例: 10月のメンテナンス予定"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-200">
                本文
              </label>
              <textarea
                className="min-h-[140px] rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/50"
                placeholder="詳細を記載してください。改行も可能です。"
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </fieldset>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500"
                  checked={highlight}
                  onChange={(event) => setHighlight(event.target.checked)}
                />
                注目マークを付ける
              </label>

              <div className="flex flex-col gap-2 text-sm text-slate-200">
                <span>公開日時（任意）</span>
                <input
                  type="datetime-local"
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/50"
                  value={publishedAt}
                  onChange={(event) => setPublishedAt(event.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isFormDisabled}
              className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              {status.kind === "loading" ? "投稿中..." : "お知らせを投稿"}
            </button>

            {status.kind === "error" && (
              <p className="text-sm font-medium text-rose-400">
                {status.message}
              </p>
            )}
            {status.kind === "success" && (
              <p className="text-sm font-medium text-emerald-400">
                {status.message}
              </p>
            )}
          </form>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-white">投稿済み一覧</h2>
          {announcements.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-700 bg-slate-900/40 px-4 py-6 text-center text-sm text-slate-300">
              まだ投稿はありません。
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {announcements.map((announcement) => (
                <li
                  key={announcement.id}
                  className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-base font-semibold text-slate-100 sm:text-lg">
                        {announcement.title}
                      </h3>
                      <time className="text-xs uppercase tracking-wide text-slate-400">
                        {dateFormatter.format(
                          new Date(announcement.publishedAt),
                        )}
                      </time>
                    </div>
                    {announcement.highlight && (
                      <span className="w-fit rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-200">
                        注目
                      </span>
                    )}
                    <p className="whitespace-pre-line text-sm leading-6 text-slate-200">
                      {announcement.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
