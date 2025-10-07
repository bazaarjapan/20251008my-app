import Link from "next/link";
import { getAnnouncements } from "@/lib/announcements";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AnnouncementsArchivePage() {
  const announcements = await getAnnouncements();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-8">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            お知らせ一覧
          </h1>
          <p className="text-sm text-slate-300 sm:text-base">
            最新順に並んだお知らせを確認できます。
          </p>
          <Link
            href="/"
            className="text-sm font-medium text-sky-300 hover:text-sky-200"
          >
            ホームに戻る →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {announcements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-400">
            まだお知らせはありません。管理者に投稿を依頼してください。
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {announcements.map((announcement) => (
              <li
                key={announcement.id}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-5"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-slate-100">
                      {announcement.title}
                    </h2>
                    <time className="text-xs uppercase tracking-wide text-slate-400">
                      {dateFormatter.format(new Date(announcement.publishedAt))}
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
      </main>
    </div>
  );
}
