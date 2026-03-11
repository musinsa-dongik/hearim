import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type WeeklyItem = {
  id: string;
  title: string;
  week_number: number;
  week_start: string;
  week_end: string;
  summary: string | null;
  daily_count: number;
  contributors: string[];
};

export default async function WeeklyListPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("weeklies")
    .select(
      "id, title, week_number, week_start, week_end, summary, daily_count, contributors"
    )
    .eq("status", "published")
    .order("week_number", { ascending: false });

  const weeklies = (data ?? []) as unknown as WeeklyItem[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        위클리 목록
      </h1>

      {weeklies.length === 0 ? (
        <p className="mt-4 text-zinc-500">아직 생성된 위클리가 없습니다.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {weeklies.map((weekly) => (
            <Link
              key={weekly.id}
              href={`/weekly/${weekly.id}`}
              className="block rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {weekly.title}
                </h2>
                <span className="text-sm text-zinc-400">
                  W{weekly.week_number}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-sm text-zinc-500">
                <span>
                  {weekly.week_start} ~ {weekly.week_end}
                </span>
                <span>·</span>
                <span>데일리 {weekly.daily_count}건</span>
                <span>·</span>
                <span>참여자 {weekly.contributors.length}명</span>
              </div>
              {weekly.summary && (
                <p className="mt-2 text-sm text-zinc-500">{weekly.summary}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
