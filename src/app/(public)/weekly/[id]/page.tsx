import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";

type Weekly = {
  id: string;
  title: string;
  week_number: number;
  week_start: string;
  week_end: string;
  content: string;
  summary: string | null;
  daily_count: number;
  contributors: string[];
  status: string;
};

export default async function WeeklyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("weeklies")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) {
    notFound();
  }

  const weekly = data as unknown as Weekly;

  // draft 위클리는 비공개
  if (weekly.status === "draft") {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{weekly.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">W{weekly.week_number}</Badge>
          <span>
            {weekly.week_start} ~ {weekly.week_end}
          </span>
          <span>·</span>
          <span>데일리 {weekly.daily_count}건</span>
          <span>·</span>
          <span>참여자 {weekly.contributors.length}명</span>
        </div>
        {weekly.contributors.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {weekly.contributors.map((name) => (
              <Badge key={name} variant="success">
                {name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <article className="prose prose-zinc max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {weekly.content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
