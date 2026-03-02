export default async function WeeklyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-zinc-500">위클리 ID: {id}</p>
      <p className="mt-2 text-zinc-400">Supabase 연동 후 내용이 표시됩니다.</p>
    </div>
  );
}
