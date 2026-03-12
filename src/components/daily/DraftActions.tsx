"use client";

import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

// NOTE: Supabase RLS 정책 현황 (임시 전체 공개)
// TODO: RLS를 본인만 수정/삭제 가능하도록 변경 필요
// - SELECT: status='published' OR author_id=auth.uid()
// - UPDATE: author_id=auth.uid()
// - DELETE: author_id=auth.uid()
export default function DraftActions({ dailyId }: { dailyId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handlePublish() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("dailies")
      .update({ status: "published" } as never)
      .eq("id", dailyId);

    if (error) {
      alert("게시 실패: " + error.message);
      setLoading(false);
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("dailies").delete().eq("id", dailyId);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button variant="primary" onClick={handlePublish} disabled={loading}>
        확정
      </Button>
      <Button
        variant="secondary"
        onClick={() => router.push(`/daily/${dailyId}/edit`)}
        disabled={loading}
      >
        수정
      </Button>
      <Button variant="ghost" onClick={handleDelete} disabled={loading}>
        삭제
      </Button>
    </div>
  );
}
