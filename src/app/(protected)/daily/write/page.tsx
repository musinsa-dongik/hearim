"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import MarkdownEditor from "@/components/daily/DynamicMarkdownEditor";
import { createClient } from "@/lib/supabase/client";

export default function DailyWritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("dailies").insert({
      title: title.trim(),
      date,
      content: content.trim(),
      summary: summary.trim() || null,
      status: "draft",
      author_id: user.id,
    } as never);

    if (error) {
      alert("저장 실패: " + error.message);
      setLoading(false);
      return;
    }

    router.push("/daily/drafts");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-hearim-text">
        데일리 직접 작성
      </h1>
      <p className="mt-1 text-sm text-hearim-muted">
        마크다운 에디터로 직접 작성합니다. 초안으로 저장됩니다.
      </p>

      <div className="mt-8 space-y-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-hearim-text">
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="오늘의 메타인지 제목"
            className="w-full rounded-lg border border-hearim-border bg-hearim-bg px-4 py-2 text-sm text-hearim-text focus:outline-none focus:ring-2 focus:ring-hearim-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-hearim-text">
            날짜
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
          <MarkdownEditor initialContent="" onChange={setContent} />
        </div>

        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "저장 중..." : "초안 저장"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push("/daily/drafts")}
            disabled={loading}
          >
            취소
          </Button>
        </div>
      </div>
    </div>
  );
}
