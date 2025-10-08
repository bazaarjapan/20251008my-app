import { getAnnouncements } from "@/lib/announcements";
import Link from "next/link";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function Home() {
  const announcements = await getAnnouncements();
  const [latest, ...rest] = announcements;

  return (
    <div className="bg-white text-slate-900">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:py-8">
        <div className="flex justify-end">
          <Link
            href="/admin/announcements"
            className="text-xs font-medium text-slate-400 transition hover:text-slate-600"
            prefetch={false}
          >
            管理者ページ
          </Link>
        </div>
        {!latest ? (
          <section className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            現在表示できるお知らせはありません。新しい投稿が追加されるとこちらに表示されます。
          </section>
        ) : (
          <>
            <section className="rounded-md border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-xs font-semibold text-sky-600">
                最終更新 {dateFormatter.format(new Date(latest.publishedAt))}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">
                {latest.title}
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                {latest.body}
              </p>
              {latest.highlight && (
                <span className="mt-4 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  注目情報
                </span>
              )}
            </section>

            {rest.length > 0 && (
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-slate-600">
                  過去のお知らせ
                </h3>
                <ul className="flex flex-col gap-3">
                  {rest.map((announcement) => (
                    <li
                      key={announcement.id}
                      className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <h4 className="text-sm font-semibold text-slate-900 sm:text-base">
                            {announcement.title}
                          </h4>
                          <time className="text-xs text-slate-500">
                            {dateFormatter.format(
                              new Date(announcement.publishedAt),
                            )}
                          </time>
                        </div>
                        {announcement.highlight && (
                          <span className="w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            注目
                          </span>
                        )}
                        <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
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
    </div>
  );
}
