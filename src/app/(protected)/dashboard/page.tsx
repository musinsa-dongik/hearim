import DashboardContent from "@/components/dashboard/DashboardContent";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        나와 팀의 메타인지 활동을 한눈에 확인하세요.
      </p>
      <DashboardContent />
    </div>
  );
}
