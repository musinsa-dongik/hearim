import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import DraftActions from "@/components/daily/DraftActions";

type DraftItem = {
  id: string;
  title: string;
  date: string;
  summary: string | null;
  created_at: string;
  profiles: { name: string } | null;
};

export default async function DailyDraftsPage() {
  const supabase = await createClient();

  // TODO: 로그인 구현 후 author_id = user.id 조건 추가하여 본인 draft만 조회
  // 현재는 Supabase RLS를 임시로 전체 공개(USING true)로 설정한 상태
  const { data } = await supabase
    .from("dailies")
    .select("id, title, date, summary, created_at, profiles(name)")
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  const drafts = (data ?? []) as unknown as DraftItem[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-hearim-text">내 초안</h1>
      <p className="mt-2 text-sm text-hearim-muted">
        draft 상태의 데일리를 확인하고 확정/삭제할 수 있습니다.
      </p>

      {drafts.length === 0 ? (
        <p className="mt-8 text-hearim-muted">초안이 없습니다.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {drafts.map((draft) => (
            <Card key={draft.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">초안</Badge>
                    <span className="text-sm text-hearim-muted">
                      {draft.date}
                    </span>
                  </div>
                  <Link
                    href={`/daily/${draft.id}`}
                    className="mt-2 block font-semibold text-hearim-text hover:underline"
                  >
                    {draft.title}
                  </Link>
                  {draft.summary && (
                    <p className="mt-1 text-sm text-hearim-muted">
                      {draft.summary}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <DraftActions dailyId={draft.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
