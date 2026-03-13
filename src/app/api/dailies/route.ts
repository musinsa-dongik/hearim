import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "0", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "10", 10);

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from("dailies")
      .select("id, title, date, summary, profiles(name)")
      .eq("status", "published")
      .order("date", { ascending: false })
      .range(from, to),
    supabase
      .from("dailies")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalCount = count ?? 0;
  const hasMore = from + pageSize < totalCount;

  return NextResponse.json({
    dailies: data ?? [],
    nextPage: hasMore ? page + 1 : undefined,
    totalCount,
  });
}
