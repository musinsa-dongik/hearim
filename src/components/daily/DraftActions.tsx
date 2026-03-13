"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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
      toast.error("게시 실패: " + error.message);
      setLoading(false);
      return;
    }
    toast.success("데일리가 게시되었습니다.");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("dailies").delete().eq("id", dailyId);

    if (error) {
      toast.error("삭제 실패: " + error.message);
      setLoading(false);
      return;
    }
    toast.success("삭제되었습니다.");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handlePublish} disabled={loading}>
        확정
      </Button>
      <Button
        variant="outline"
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
