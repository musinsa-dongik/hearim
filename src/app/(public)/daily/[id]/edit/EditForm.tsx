"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import MarkdownEditor from "@/components/daily/DynamicMarkdownEditor";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Daily = {
  id: string;
  title: string;
  date: string;
  content: string;
  summary: string | null;
  status: string;
};

export default function EditForm({ daily }: { daily: Daily }) {
  const router = useRouter();
  const [title, setTitle] = useState(daily.title);
  const [summary, setSummary] = useState(daily.summary ?? "");
  const [content, setContent] = useState(daily.content);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      toast.warning("제목을 입력해 주세요.");
      return;
    }
    if (!content.trim()) {
      toast.warning("본문을 입력해 주세요.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("dailies")
      .update({
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim() || null,
      } as never)
      .eq("id", daily.id);

    if (error) {
      toast.error("저장 실패: " + error.message);
      setLoading(false);
      return;
    }

    toast.success("저장되었습니다.");
    router.push(`/daily/${daily.id}`);
  }

  return (
    <div className="mt-8 space-y-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          제목
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          요약 (선택)
        </label>
        <input
          type="text"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="한 줄 요약"
          className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          본문
        </label>
        <MarkdownEditor initialContent={daily.content} onChange={setContent} />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "저장 중..." : "저장"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push(`/daily/${daily.id}`)}
          disabled={loading}
        >
          취소
        </Button>
      </div>
    </div>
  );
}
