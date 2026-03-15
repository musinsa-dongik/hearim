"use client";

import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

type FilterType = "all" | "mine" | "team";

type DailyItem = {
  id: string;
  title: string;
  date: string;
  summary: string | null;
  profiles: { name: string } | null;
};

type DailiesResponse = {
  dailies: DailyItem[];
  nextPage?: number;
  totalCount: number;
};

async function fetchDailies({
  pageParam = 0,
  filter = "all",
}: {
  pageParam?: number;
  filter?: FilterType;
}): Promise<DailiesResponse> {
  const res = await fetch(
    `/api/dailies?page=${pageParam}&pageSize=10&filter=${filter}`
  );
  if (!res.ok) throw new Error("Failed to fetch dailies");
  return res.json();
}

function DailySkeleton() {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="mt-2 h-4 w-72" />
    </div>
  );
}

export default function DailyListInfinite() {
  const { ref, inView } = useInView();
  const [filter, setFilter] = useState<FilterType>("all");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 로그인 상태 확인
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["dailies", filter],
    queryFn: ({ pageParam }) => fetchDailies({ pageParam, filter }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <DailySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="mt-4 text-muted-foreground">
        데일리를 불러오는 중 오류가 발생했습니다.
      </p>
    );
  }

  const allDailies = data?.pages.flatMap((page) => page.dailies) ?? [];

  const filterTabs: { key: FilterType; label: string; requiresAuth: boolean }[] = [
    { key: "all", label: "전체보기", requiresAuth: false },
    { key: "team", label: "우리 팀", requiresAuth: true },
    { key: "mine", label: "내것만 보기", requiresAuth: true },
  ];

  return (
    <>
      {/* 필터 탭 */}
      <div className="mt-6 flex gap-2">
        {filterTabs
          .filter((tab) => !tab.requiresAuth || isLoggedIn)
          .map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {tab.label}
            </button>
          ))}
      </div>

      {allDailies.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          {filter === "mine"
            ? "내가 작성한 데일리가 없습니다."
            : filter === "team"
              ? "우리 팀 데일리가 없습니다."
              : "아직 작성된 데일리가 없습니다."}
        </p>
      ) : (
        <>
          <div className="mt-4 space-y-4">
            {allDailies.map((daily) => (
              <Link
                key={daily.id}
                href={`/daily/${daily.id}`}
                className="block rounded-lg border border-border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">{daily.title}</h2>
                  <span className="text-sm text-muted-foreground">
                    {daily.profiles?.name}
                  </span>
                </div>
                {daily.summary && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {daily.summary}
                  </p>
                )}
              </Link>
            ))}
          </div>

          <div ref={ref} className="py-8 text-center">
            {isFetchingNextPage ? (
              <div className="space-y-4">
                <DailySkeleton />
                <DailySkeleton />
              </div>
            ) : hasNextPage ? (
              <span className="text-sm text-muted-foreground">더 불러오는 중...</span>
            ) : (
              <span className="text-sm text-muted-foreground">
                모든 데일리를 불러왔습니다
              </span>
            )}
          </div>
        </>
      )}
    </>
  );
}
