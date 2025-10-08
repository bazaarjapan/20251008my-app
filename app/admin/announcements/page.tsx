"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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
  const [authStatus, setAuthStatus] = useState<Status>({ kind: "idle" });
  const [isAuthorized, setIsAuthorized] = useState(false);

  const isEditing = editingId !== null;
  const trimmedToken = token.trim();

  const isFormDisabled = useMemo(
    () =>
      status.kind === "loading" ||
      !isAuthorized ||
      title.trim().length === 0 ||
      body.trim().length === 0 ||
      trimmedToken.length === 0,
    [status.kind, isAuthorized, title, body, trimmedToken],
  );

  const refreshAnnouncements = useCallback(async () => {
    if (!isAuthorized) {
      return;
    }

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
  }, [isAuthorized]);

  useEffect(() => {
    if (isAuthorized) {
      void refreshAnnouncements();
    }
  }, [isAuthorized, refreshAnnouncements]);

  function resetForm() {
    setTitle("");
    setBody("");
    setHighlight(false);
    setPublishedAt("");
    setEditingId(null);
  }

  async function handleAuthorize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (trimmedToken.length === 0) {
      setAuthStatus({
        kind: "error",
        message: "管理者トークンを入力してください。",
      });
      return;
    }

    setAuthStatus({ kind: "loading" });

    try {
      const res = await fetch("/api/admin/validate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${trimmedToken}`,
        },
      });

      if (!res.ok) {
        const detail = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(
          detail?.error ?? `認証に失敗しました (${res.status})`,
        );
      }

      setIsAuthorized(true);
      setAuthStatus({ kind: "success", message: "認証に成功しました。" });
      setStatus({ kind: "idle" });
    } catch (error) {
      console.error(error);
      setIsAuthorized(false);
      setAuthStatus({
        kind: "error",
        message:
          error instanceof Error ? error.message : "認証に失敗しました。",
      });
    }
  }

  function handleSignOut() {
    setIsAuthorized(false);
    setAnnouncements([]);
    resetForm();
    setStatus({ kind: "idle" });
    setAuthStatus({ kind: "idle" });
    setToken("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAuthorized || trimmedToken.length === 0) {
      setStatus({
        kind: "error",
        message: "先に管理者トークンを認証してください。",
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
          Authorization: `Bearer ${trimmedToken}`,
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
    if (!isAuthorized || trimmedToken.length === 0) {
      setStatus({
        kind: "error",
        message: "削除には認証済みのトークンが必要です。",
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
          Authorization: `Bearer ${trimmedToken}`,
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

  if (!isAuthorized) {
    return (
      <div className="bg-white text-slate-900">
        <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              管理者コンソールにアクセス
            </h1>
            <p className="text-sm text-slate-600">
              `.env.local` または Vercel の環境変数で設定した{" "}
              <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                ADMIN_TOKEN
              </code>{" "}
              を入力してください。
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleAuthorize}>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              管理者トークン
              <input
                type="password"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="例: xxxxxxxx"
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
              disabled={authStatus.kind === "loading"}
            >
              {authStatus.kind === "loading"
                ? "認証中..."
                : "管理者コンソールを開く"}
            </button>

            {authStatus.kind === "error" && (
              <p className="text-sm font-medium text-rose-500">
                {authStatus.message}
              </p>
            )}
          </form>

          <Link
            href="/"
            className="text-xs font-medium text-slate-400 transition hover:text-slate-600"
          >
            公開ページへ戻る
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-white text-slate-900">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                管理者コンソール
              </h1>
              <p className="text-sm text-slate-600">
                投稿の追加・編集・削除はすべて認証済みのトークンで行われます。
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs font-medium text-slate-400 underline-offset-4 transition hover:text-slate-600 hover:underline"
            >
              認証をやり直す
            </button>
          </div>
          {authStatus.kind === "success" && (
            <p className="text-xs font-medium text-emerald-600">
              {authStatus.message}
            </p>
          )}
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {isEditing && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              編集モード: 変更後に「{submitLabel}」を押してください。
            </div>
          )}
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <fieldset className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                管理者トークン
              </label>
              <input
                type="password"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="認証済みのトークンを必要に応じて更新"
                value={token}
                onChange={(event) => setToken(event.target.value)}
              />
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                タイトル
              </label>
              <input
                type="text"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="例: 10月のメンテナンス予定"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                本文
              </label>
              <textarea
                className="min-h-[140px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="詳細を記載してください。改行も可能です。"
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </fieldset>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-slate-400 bg-white text-sky-600 focus:ring-sky-500"
                  checked={highlight}
                  onChange={(event) => setHighlight(event.target.checked)}
                />
                注目マークを付ける
              </label>

              <div className="flex flex-col gap-2 text-sm text-slate-700">
                <span>公開日時（任意）</span>
                <input
                  type="datetime-local"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  value={publishedAt}
                  onChange={(event) => setPublishedAt(event.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={isFormDisabled}
                className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                {status.kind === "loading" ? loadingLabel : submitLabel}
              </button>

              {isEditing && (
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                  onClick={handleCancelEdit}
                >
                  編集をキャンセル
                </button>
              )}
            </div>

            {status.kind === "error" && (
              <p className="text-sm font-medium text-rose-500">
                {status.message}
              </p>
            )}
            {status.kind === "success" && (
              <p className="text-sm font-medium text-emerald-600">
                {status.message}
              </p>
            )}
          </form>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            投稿済み一覧
          </h2>
          {announcements.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              まだ投稿はありません。
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {announcements.map((announcement) => {
                const isCurrentEditing = editingId === announcement.id;
                return (
                  <li
                    key={announcement.id}
                    className={`rounded-lg border bg-white p-4 shadow-sm transition ${
                      isCurrentEditing
                        ? "border-sky-400 shadow-sky-100"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex flex-col gap-1">
                          <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                            {announcement.title}
                          </h3>
                          <time className="text-xs text-slate-500">
                            {dateFormatter.format(
                              new Date(announcement.publishedAt),
                            )}
                          </time>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                            onClick={() => handleEditSelect(announcement)}
                          >
                            編集
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-rose-200 px-3 py-1 text-xs font-medium text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                            onClick={() => void handleDelete(announcement.id)}
                          >
                            削除
                          </button>
                        </div>
                      </div>
                      {announcement.highlight && (
                        <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                          注目
                        </span>
                      )}
                      <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
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
