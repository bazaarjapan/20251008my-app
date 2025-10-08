import { getAnnouncements } from "@/lib/announcements";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AnnouncementsArchivePage() {
  const announcements = await getAnnouncements();

  return (
    <div className="bg-white text-slate-900">
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <h1 className="text-lg font-semibold text-slate-800 sm:text-xl">
          お知らせ一覧
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          最新のお知らせから順に表示しています。
        </p>

        {announcements.length === 0 ? (
          <div className="mt-6 rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            現在表示できるお知らせはありません。
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {announcements.map((announcement) => (
              <li
                key={announcement.id}
                className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
                      {announcement.title}
                    </h2>
                    <time className="text-xs text-slate-500">
                      {dateFormatter.format(new Date(announcement.publishedAt))}
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
        )}
      </main>
    </div>
  );
}
