import DailyListInfinite from "@/components/daily/DailyListInfinite";

export default function DailyListPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-foreground">데일리 목록</h1>
      <DailyListInfinite />
    </div>
  );
}
