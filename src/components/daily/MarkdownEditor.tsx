"use client";

import { useEffect, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useTheme } from "next-themes";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

type Props = {
  initialContent?: string;
  onChange: (content: string) => void;
};

export default function MarkdownEditor({
  initialContent = "",
  onChange,
}: Props) {
  const loaded = useRef(false);
  const { resolvedTheme } = useTheme();

  const editor = useCreateBlockNote();

  // 초기 마크다운 → 블록 변환 (최초 1회)
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    if (!initialContent) return;

    async function load() {
      const blocks = await editor.tryParseMarkdownToBlocks(initialContent);
      editor.replaceBlocks(editor.document, blocks);
    }
    load();
  }, [editor, initialContent]);

  async function handleChange() {
    const md = await editor.blocksToMarkdownLossy(editor.document);
    onChange(md);
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden [&_.bn-container]:!font-sans [&_.bn-editor]:!py-6 [&_.bn-editor]:!px-[20px]">
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        theme={resolvedTheme === "light" ? "light" : "dark"}
      />
    </div>
  );
}
