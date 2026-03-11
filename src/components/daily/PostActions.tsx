"use client";

import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

// 확정(published)된 게시물의 삭제 버튼
export default function PostActions({ dailyId }: { dailyId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("확정된 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("dailies").delete().eq("id", dailyId);

    if (error) {
      alert("삭제 실패: " + error.message);
      setLoading(false);
      return;
    }
    router.push("/daily");
  }

  return (
    <div className="flex gap-2">
      <Button variant="ghost" onClick={handleDelete} disabled={loading}>
        삭제
      </Button>
    </div>
  );
}
