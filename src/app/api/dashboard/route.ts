import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Team stats
  const [
    { count: totalDailies },
    { data: allPublished },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from("dailies")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("dailies")
      .select("author_id, date, profiles(name)")
      .eq("status", "published")
      .order("date", { ascending: false }),
    supabase.from("profiles").select("id, name"),
  ]);

  const published = (allPublished ?? []) as unknown as {
    author_id: string;
    date: string;
    profiles: { name: string } | null;
  }[];

  const participantCount = new Set(published.map((d) => d.author_id)).size;

  // This week's dailies (Mon-Sun)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const weekStart = monday.toISOString().slice(0, 10);

  const thisWeekAll = published.filter((d) => d.date >= weekStart);

  // Top 5 contributors
  const authorCounts: Record<string, { name: string; count: number }> = {};
  for (const d of published) {
    const name = d.profiles?.name ?? "Unknown";
    if (!authorCounts[d.author_id]) {
      authorCounts[d.author_id] = { name, count: 0 };
    }
    authorCounts[d.author_id].count++;
  }
  const topContributors = Object.values(authorCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Personal stats (if logged in)
  let personal = null;
  if (user) {
    const myDailies = published.filter((d) => d.author_id === user.id);
    const myThisWeek = thisWeekAll.filter((d) => d.author_id === user.id);

    const { count: draftCount } = await supabase
      .from("dailies")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft")
      .eq("author_id", user.id);

    // Calculate streak
    const myDates = [...new Set(myDailies.map((d) => d.date))].sort(
      (a, b) => b.localeCompare(a),
    );
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    let checkDate = new Date(today);

    for (const date of myDates) {
      const dateStr = checkDate.toISOString().slice(0, 10);
      if (date === dateStr) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (date < dateStr) {
        break;
      }
    }

    const profileData = (profiles ?? []).find((p: { id: string; name: string }) => p.id === user.id) as { id: string; name: string } | undefined;

    personal = {
      name: profileData?.name ?? user.email ?? "사용자",
      totalDailies: myDailies.length,
      streak,
      thisWeekCount: myThisWeek.length,
      draftCount: draftCount ?? 0,
    };
  }

  return NextResponse.json({
    personal,
    team: {
      totalDailies: totalDailies ?? 0,
      participantCount,
      thisWeekCount: thisWeekAll.length,
      topContributors,
    },
  });
}
