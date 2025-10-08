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

const toDateTimeLocalValue = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (value: number) => value.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [highlight, setHighlight] = useState(false);
  const [publishedAt, setPublishedAt] = useState("");
  const [token, setToken] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const isEditing = editingId !== null;

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

  function resetForm() {
    setTitle("");
    setBody("");
    setHighlight(false);
    setPublishedAt("");
    setEditingId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (token.trim().length === 0) {
      setStatus({
        kind: "error",
        message: "管理者トークンを入力してください。",
      });
      return;
    }

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

    const endpoint = isEditing
      ? `/api/admin/announcements/${editingId}`
      : "/api/admin/announcements";
    const method = isEditing ? "PATCH" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
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
        throw new Error(
          detail?.error ??
            (isEditing
              ? `更新に失敗しました (${res.status})`
              : `投稿に失敗しました (${res.status})`),
        );
      }

      await refreshAnnouncements();
      resetForm();
      setStatus({
        kind: "success",
        message: isEditing
          ? "お知らせを更新しました。"
          : "お知らせを投稿しました。",
      });
    } catch (error) {
      console.error(error);
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : isEditing
              ? "お知らせの更新に失敗しました。"
              : "お知らせの投稿に失敗しました。",
      });
    }
  }

  function handleEditSelect(announcement: Announcement) {
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setBody(announcement.body);
    setHighlight(Boolean(announcement.highlight));
    setPublishedAt(toDateTimeLocalValue(announcement.publishedAt));
    setStatus({ kind: "idle" });
  }

  function handleCancelEdit() {
    resetForm();
    setStatus({ kind: "idle" });
  }

  async function handleDelete(id: string) {
    if (token.trim().length === 0) {
      setStatus({
        kind: "error",
        message: "削除には管理者トークンが必要です。",
      });
      return;
    }

    const confirmed = window.confirm("このお知らせを削除しますか？");
    if (!confirmed) {
      return;
    }

    setStatus({ kind: "loading" });

    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token.trim()}`,
        },
      });

      if (!res.ok) {
        const detail = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(detail?.error ?? `削除に失敗しました (${res.status})`);
      }

      if (editingId === id) {
        resetForm();
      }

      await refreshAnnouncements();
      setStatus({ kind: "success", message: "お知らせを削除しました。" });
    } catch (error) {
      console.error(error);
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "お知らせの削除に失敗しました。",
      });
    }
  }

  const submitLabel = isEditing ? "お知らせを更新" : "お知らせを投稿";
  const loadingLabel = isEditing ? "更新中..." : "投稿中...";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-8">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            管理者用お知らせ投稿
          </h1>
          <p className="text-sm text-slate-300 sm:text-base">
            環境変数{" "}
            <code className="rounded bg-slate-800 px-2 py-1 text-xs">
              ADMIN_TOKEN
            </code>{" "}
            を設定済みの管理者のみが投稿・編集・削除できます。
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
          {isEditing && (
            <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              編集モード: 変更後に「{submitLabel}」を押してください。
            </div>
          )}
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={isFormDisabled}
                className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600"
              >
                {status.kind === "loading" ? loadingLabel : submitLabel}
              </button>

              {isEditing && (
                <button
                  type="button"
                  className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-400 hover:text-white"
                  onClick={handleCancelEdit}
                >
                  編集をキャンセル
                </button>
              )}
            </div>

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
              {announcements.map((announcement) => {
                const isCurrentEditing = editingId === announcement.id;
                return (
                  <li
                    key={announcement.id}
                    className={`rounded-lg border bg-slate-900/60 p-4 transition ${
                      isCurrentEditing
                        ? "border-sky-500/60 shadow-lg shadow-sky-900/40"
                        : "border-slate-800"
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex flex-col gap-1">
                          <h3 className="text-base font-semibold text-slate-100 sm:text-lg">
                            {announcement.title}
                          </h3>
                          <time className="text-xs uppercase tracking-wide text-slate-400">
                            {dateFormatter.format(
                              new Date(announcement.publishedAt),
                            )}
                          </time>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-slate-600 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-slate-400 hover:text-white"
                            onClick={() => handleEditSelect(announcement)}
                          >
                            編集
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-rose-500/60 px-3 py-1 text-xs font-medium text-rose-300 transition hover:border-rose-400 hover:text-rose-200"
                            onClick={() => void handleDelete(announcement.id)}
                          >
                            削除
                          </button>
                        </div>
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
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
