import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";

type DailyItem = {
  id: string;
  title: string;
  date: string;
  summary: string | null;
  profiles: { name: string } | null;
};

export default async function Home() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("dailies")
    .select("id, title, date, summary, profiles(name)")
    .eq("status", "published")
    .order("date", { ascending: false })
    .limit(5);

  const recentDailies = (data ?? []) as unknown as DailyItem[];

  // TODO: 로그인 구현 후 본인 draft만 조회하도록 변경
  const { data: draftData } = await supabase
    .from("dailies")
    .select("id, title, date, summary, profiles(name)")
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(5);

  const recentDrafts = (draftData ?? []) as unknown as DailyItem[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          헤아림
        </h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          내가 안다고 생각한 것을, 말로 헤아려보는 시간
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/daily"
            className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            데일리 보기
          </Link>
          <Link
            href="/weekly"
            className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            위클리 보기
          </Link>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          최근 데일리
        </h2>
        {recentDailies.length === 0 ? (
          <p className="mt-4 text-zinc-500">아직 작성된 데일리가 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {recentDailies.map((daily) => (
              <Link
                key={daily.id}
                href={`/daily/${daily.id}`}
                className="block rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {daily.title}
                  </h3>
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
      </section>

      {recentDrafts.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              내 초안
            </h2>
            <Link
              href="/daily/drafts"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              전체 보기
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentDrafts.map((draft) => (
              <Link
                key={draft.id}
                href={`/daily/${draft.id}`}
                className="block rounded-lg border border-amber-200 p-4 transition-colors hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">초안</Badge>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {draft.title}
                    </h3>
                  </div>
                  <span className="text-sm text-zinc-400">
                    {draft.profiles?.name}
                  </span>
                </div>
                {draft.summary && (
                  <p className="mt-1 text-sm text-zinc-500">{draft.summary}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
