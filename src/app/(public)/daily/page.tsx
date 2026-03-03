import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type DailyItem = {
  id: string;
  title: string;
  date: string;
  summary: string | null;
  profiles: { name: string } | null;
};

export default async function DailyListPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("dailies")
    .select("id, title, date, summary, profiles(name)")
    .eq("status", "published")
    .order("date", { ascending: false });

  const dailies = (data ?? []) as unknown as DailyItem[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        데일리 목록
      </h1>

      {dailies.length === 0 ? (
        <p className="mt-4 text-zinc-500">아직 작성된 데일리가 없습니다.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {dailies.map((daily) => (
            <Link
              key={daily.id}
              href={`/daily/${daily.id}`}
              className="block rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {daily.title}
                </h2>
                <span className="text-sm text-zinc-400">
                  {daily.profiles?.name}
                </span>
              </div>
              {daily.summary && (
                <p className="mt-1 text-sm text-zinc-500">{daily.summary}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
