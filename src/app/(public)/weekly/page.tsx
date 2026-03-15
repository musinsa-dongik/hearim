import { createClient } from "@/lib/supabase/server";
import WeeklyList from "@/components/weekly/WeeklyList";

export default async function WeeklyListPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("weeklies")
    .select(
      "id, title, week_number, week_start, week_end, content, summary, daily_count, contributors",
    )
    .eq("status", "published")
    .order("week_number", { ascending: false });

  const weeklies = (data ?? []) as unknown as {
    id: string;
    title: string;
    week_number: number;
    week_start: string;
    week_end: string;
    content: string;
    summary: string | null;
    daily_count: number;
    contributors: string[];
  }[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-foreground">위클리 목록</h1>
      <WeeklyList weeklies={weeklies} />
    </div>
  );
}
