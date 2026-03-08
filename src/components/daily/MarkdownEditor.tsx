"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  initialContent?: string;
  onChange: (content: string) => void;
};

export default function MarkdownEditor({
  initialContent = "",
  onChange,
}: Props) {
  const [content, setContent] = useState(initialContent);
  const [tab, setTab] = useState<"write" | "preview">("write");

  function handleChange(value: string) {
    setContent(value);
    onChange(value);
  }

  return (
    <div>
      <div className="mb-2 flex gap-2 border-b border-hearim-border">
        <button
          type="button"
          className={`px-3 py-1.5 text-sm font-medium ${
            tab === "write"
              ? "border-b-2 border-hearim-primary text-hearim-text"
              : "text-hearim-muted"
          }`}
          onClick={() => setTab("write")}
        >
          작성
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-sm font-medium ${
            tab === "preview"
              ? "border-b-2 border-hearim-primary text-hearim-text"
              : "text-hearim-muted"
          }`}
          onClick={() => setTab("preview")}
        >
          미리보기
        </button>
      </div>

      {tab === "write" ? (
        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full min-h-[400px] rounded-lg border border-hearim-border bg-hearim-bg p-4 font-mono text-sm text-hearim-text focus:outline-none focus:ring-2 focus:ring-hearim-primary"
          placeholder="마크다운으로 작성하세요..."
        />
      ) : (
        <article className="prose prose-zinc max-w-none dark:prose-invert min-h-[400px] rounded-lg border border-hearim-border p-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content || "*내용을 입력하면 미리보기가 표시됩니다.*"}
          </ReactMarkdown>
        </article>
      )}
    </div>
  );
}
