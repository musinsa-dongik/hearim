import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "0", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "10", 10);
  const filter = searchParams.get("filter") ?? "all"; // all | mine | team
  const search = searchParams.get("search") ?? "";

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  // "mine" / "team" 필터: 로그인 필요
  let authorId: string | null = null;
  let teamMemberIds: string[] | null = null;

  if (filter === "mine" || filter === "team") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    if (filter === "mine") {
      authorId = user.id;
    } else if (filter === "team") {
      // 같은 팀 멤버의 author_id 목록 조회
      // ⚠️ profiles 테이블에 team_id 컬럼 추가 후 동작 (DB 작업 필요)
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single<{ team_id: string | null }>();

      if (myProfile?.team_id) {
        const { data: teamMembers } = await supabase
          .from("profiles")
          .select("id")
          .eq("team_id", myProfile.team_id)
          .returns<{ id: string }[]>();

        teamMemberIds = teamMembers?.map((m) => m.id) ?? [];
      } else {
        // team_id가 없으면 내 것만 보기로 fallback
        authorId = user.id;
      }
    }
  }

  // 데이터 쿼리 빌더
  let dataQuery = supabase
    .from("dailies")
    .select("id, title, date, summary, profiles(name)")
    .eq("status", "published")
    .order("date", { ascending: false })
    .range(from, to);

  let countQuery = supabase
    .from("dailies")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  if (authorId) {
    dataQuery = dataQuery.eq("author_id", authorId);
    countQuery = countQuery.eq("author_id", authorId);
  } else if (teamMemberIds) {
    dataQuery = dataQuery.in("author_id", teamMemberIds);
    countQuery = countQuery.in("author_id", teamMemberIds);
  }

  // 검색어 필터 (FTS RPC 사용)
  if (search) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ftsResults } = await (supabase.rpc as any)("search_dailies", { query: search });
    const ids: string[] = (ftsResults ?? []).map((r: { id: string }) => r.id);

    if (ids.length === 0) {
      return NextResponse.json({ dailies: [], totalCount: 0 });
    }

    dataQuery = dataQuery.in("id", ids);
    countQuery = countQuery.in("id", ids);
  }

  const [{ data, error }, { count }] = await Promise.all([
    dataQuery,
    countQuery,
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
