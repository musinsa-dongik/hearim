import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Badge from "@/components/ui/Badge";
import DraftActions from "@/components/daily/DraftActions";

type Daily = {
  id: string;
  author_id: string;
  title: string;
  date: string;
  content: string;
  summary: string | null;
  status: string;
  profiles: { name: string } | null;
};

export default async function DailyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("dailies")
    .select("*, profiles(name)")
    .eq("id", id)
    .single();

  if (!data) {
    notFound();
  }

  const daily = data as unknown as Daily;
  const isOwner = user?.id === daily.author_id;

  // draft는 본인만 볼 수 있음
  if (daily.status === "draft" && !isOwner) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {daily.title}
        </h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
          <span>{daily.profiles?.name}</span>
          <span>·</span>
          <span>{daily.date}</span>
          {daily.status === "draft" && (
            <Badge variant="warning">초안</Badge>
          )}
        </div>
        {daily.status === "draft" && isOwner && (
          <div className="mt-4">
            <DraftActions dailyId={daily.id} />
          </div>
        )}
      </div>

      <article className="prose prose-zinc max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {daily.content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
