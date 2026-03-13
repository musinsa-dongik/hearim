"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function PostActions({ dailyId }: { dailyId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("확정된 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("dailies").delete().eq("id", dailyId);

    if (error) {
      toast.error("삭제 실패: " + error.message);
      setLoading(false);
      return;
    }
    toast.success("삭제되었습니다.");
    router.push("/daily");
  }

  return (
    <div className="flex gap-2">
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
