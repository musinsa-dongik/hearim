import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EditForm from "./EditForm";

type Daily = {
  id: string;
  author_id: string;
  title: string;
  date: string;
  content: string;
  summary: string | null;
  status: string;
};

export default async function DailyEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data } = await supabase
    .from("dailies")
    .select("id, author_id, title, date, content, summary, status")
    .eq("id", id)
    .single();

  if (!data) {
    notFound();
  }

  const daily = data as unknown as Daily;

  // 본인만 수정 가능
  if (daily.author_id !== user.id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-hearim-text">
        데일리 수정
      </h1>
      <EditForm daily={daily} />
    </div>
  );
}
