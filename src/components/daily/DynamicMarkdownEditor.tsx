"use client";

import dynamic from "next/dynamic";

const MarkdownEditor = dynamic(() => import("./MarkdownEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-hearim-border text-sm text-hearim-muted">
      에디터 로딩 중...
    </div>
  ),
});

export default MarkdownEditor;
