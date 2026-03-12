"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import MarkdownEditor from "@/components/daily/DynamicMarkdownEditor";
import { createClient } from "@/lib/supabase/client";

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
      alert("제목을 입력해 주세요.");
      return;
    }
    if (!content.trim()) {
      alert("본문을 입력해 주세요.");
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
      alert("저장 실패: " + error.message);
      setLoading(false);
      return;
    }

    router.push(`/daily/${daily.id}`);
  }

  return (
    <div className="mt-8 space-y-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-hearim-text">
          제목
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-hearim-border bg-hearim-bg px-4 py-2 text-sm text-hearim-text focus:outline-none focus:ring-2 focus:ring-hearim-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-hearim-text">
          요약 (선택)
        </label>
        <input
          type="text"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="한 줄 요약"
          className="w-full rounded-lg border border-hearim-border bg-hearim-bg px-4 py-2 text-sm text-hearim-text focus:outline-none focus:ring-2 focus:ring-hearim-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-hearim-text">
          본문
        </label>
        <MarkdownEditor initialContent={daily.content} onChange={setContent} />
      </div>

      <div className="flex gap-2">
        <Button variant="primary" onClick={handleSave} disabled={loading}>
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
