"use client";

import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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

async function fetchDailies({ pageParam = 0 }): Promise<DailiesResponse> {
  const res = await fetch(`/api/dailies?page=${pageParam}&pageSize=10`);
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

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["dailies"],
    queryFn: fetchDailies,
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

  if (allDailies.length === 0) {
    return (
      <p className="mt-4 text-muted-foreground">
        아직 작성된 데일리가 없습니다.
      </p>
    );
  }

  return (
    <>
      <div className="mt-6 space-y-4">
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
  );
}
