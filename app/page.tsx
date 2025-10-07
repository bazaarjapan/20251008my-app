import Link from "next/link";
import { getAnnouncements } from "@/lib/announcements";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function Home() {
  const announcements = await getAnnouncements();
  const [latest, ...rest] = announcements;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-8">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            最新情報掲示板
          </h1>
          <p className="text-sm text-slate-300 sm:text-base">
            チーム全員に最新のお知らせを届けるための掲示板です。管理者のみが投稿できます。
          </p>
          <Link
            href="/announcements"
            className="text-sm font-medium text-sky-300 hover:text-sky-200"
          >
            全てのお知らせを見る →
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
        {!latest ? (
          <section className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-400">
            まだお知らせはありません。管理者ページから最初のお知らせを投稿してください。
          </section>
        ) : (
          <>
            <section className="rounded-xl border border-sky-500/40 bg-sky-900/20 p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-sky-300">
                Latest Update
              </p>
              <h2 className="text-xl font-semibold text-white sm:text-2xl">
                {latest.title}
              </h2>
              <time className="mt-2 block text-sm text-slate-300">
                {dateFormatter.format(new Date(latest.publishedAt))}
              </time>
              <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-200">
                {latest.body}
              </p>
            </section>

            {rest.length > 0 && (
              <section className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-white">
                  過去のお知らせ
                </h3>
                <ul className="flex flex-col gap-4">
                  {rest.map((announcement) => (
                    <li
                      key={announcement.id}
                      className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <h4 className="text-base font-semibold text-slate-100 sm:text-lg">
                            {announcement.title}
                          </h4>
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
              </section>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/50">
        <div className="mx-auto flex max-w-4xl flex-col gap-2 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} 最新情報掲示板</p>
          <Link
            href="/admin/announcements"
            className="font-medium text-sky-300 hover:text-sky-200"
          >
            管理者ページへ
          </Link>
        </div>
      </footer>
    </div>
  );
}
