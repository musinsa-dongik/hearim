"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

type SearchResult = {
  id: string;
  title: string;
  date?: string;
  week_number?: number;
  week_start?: string;
  week_end?: string;
  summary: string | null;
  type: "daily" | "weekly";
  profiles?: { name: string } | null;
};

function SearchForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";
  const [input, setInput] = useState(query);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query) return;
    setInput(query);
    performSearch(query);
  }, [query]);

  async function performSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);

    const supabase = createClient();

    // 데일리 검색 (FTS: Full-Text Search)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ftsResults } = await (supabase.rpc as any)("search_dailies", { query: q });

    // FTS 결과의 ID로 profiles join 조회
    const ftsIds = (ftsResults ?? []).map((r: { id: string }) => r.id);
    const { data: dailies } = ftsIds.length > 0
      ? await supabase
          .from("dailies")
          .select("id, title, date, summary, profiles(name)")
          .in("id", ftsIds)
      : { data: [] };

    // 위클리 검색 (제목/요약 ilike)
    const { data: weeklies } = await supabase
      .from("weeklies")
      .select("id, title, week_number, week_start, week_end, summary")
      .eq("status", "published")
      .or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
      .order("week_number", { ascending: false })
      .limit(20);

    const dailyResults: SearchResult[] = (dailies ?? []).map((d) => ({
      ...(d as unknown as Omit<SearchResult, "type">),
      type: "daily" as const,
    }));

    const weeklyResults: SearchResult[] = (weeklies ?? []).map((w) => ({
      ...(w as unknown as Omit<SearchResult, "type">),
      type: "weekly" as const,
    }));

    setResults([...dailyResults, ...weeklyResults]);
    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    router.push(`/search?q=${encodeURIComponent(input.trim())}`);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="제목 또는 요약으로 검색..."
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
          <Button type="submit">검색</Button>
        </div>
      </form>

      <div className="mt-8">
        {loading && (
          <p className="text-muted-foreground">검색 중...</p>
        )}

        {!loading && searched && results.length === 0 && (
          <p className="text-muted-foreground">
            &quot;{query}&quot;에 대한 검색 결과가 없습니다.
          </p>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {results.length}건의 결과
            </p>
            {results.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={
                  item.type === "daily"
                    ? `/daily/${item.id}`
                    : `/weekly/${item.id}`
                }
                className="block rounded-lg border border-border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      item.type === "daily" ? "secondary" : "success"
                    }
                  >
                    {item.type === "daily" ? "데일리" : "위클리"}
                  </Badge>
                  <h3 className="font-semibold text-foreground">
                    {item.title}
                  </h3>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {item.type === "daily" ? (
                    <>
                      {item.profiles?.name && (
                        <span>{item.profiles.name} · </span>
                      )}
                      <span>{item.date}</span>
                    </>
                  ) : (
                    <span>
                      W{item.week_number} · {item.week_start} ~{" "}
                      {item.week_end}
                    </span>
                  )}
                </div>
                {item.summary && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.summary}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-foreground">검색</h1>
      <Suspense
        fallback={<p className="mt-4 text-muted-foreground">로딩 중...</p>}
      >
        <SearchForm />
      </Suspense>
    </div>
  );
}
