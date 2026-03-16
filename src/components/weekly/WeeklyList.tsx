"use client";

import Link from "next/link";
import { useState } from "react";

type WeeklyItem = {
  id: string;
  title: string;
  week_number: number;
  week_start: string;
  week_end: string;
  content: string;
  summary: string | null;
  daily_count: number;
  contributors: string[];
};

export default function WeeklyList({ weeklies }: { weeklies: WeeklyItem[] }) {
  const [search, setSearch] = useState("");

  const q = search.toLowerCase();
  const filtered = search
    ? weeklies.filter(
        (weekly) =>
          weekly.title.toLowerCase().includes(q) ||
          weekly.content.toLowerCase().includes(q) ||
          (weekly.summary && weekly.summary.toLowerCase().includes(q))
      )
    : weeklies;

  return (
    <>
      <div className="mt-6">
        <input
          type="text"
          placeholder="검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          {search ? "검색 결과가 없습니다." : "아직 생성된 위클리가 없습니다."}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {filtered.map((weekly) => (
            <Link
              key={weekly.id}
              href={`/weekly/${weekly.id}`}
              className="block rounded-lg border border-border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">
                  {weekly.title}
                </h2>
                <span className="text-sm text-muted-foreground">
                  W{weekly.week_number}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                <span>
                  {weekly.week_start} ~ {weekly.week_end}
                </span>
                <span>·</span>
                <span>데일리 {weekly.daily_count}건</span>
                <span>·</span>
                <span>참여자 {weekly.contributors.length}명</span>
              </div>
              {weekly.summary && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {weekly.summary}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
