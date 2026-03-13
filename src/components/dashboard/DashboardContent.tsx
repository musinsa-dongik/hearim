"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardData = {
  personal: {
    name: string;
    totalDailies: number;
    streak: number;
    thisWeekCount: number;
    draftCount: number;
  } | null;
  team: {
    totalDailies: number;
    participantCount: number;
    thisWeekCount: number;
    topContributors: { name: string; count: number }[];
  };
};

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="mt-2 h-3 w-24" />
      </CardContent>
    </Card>
  );
}

export default function DashboardContent() {
  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-muted-foreground">
        대시보드를 불러오는 중 오류가 발생했습니다.
      </p>
    );
  }

  return (
    <Tabs defaultValue={data?.personal ? "personal" : "team"} className="mt-6">
      <TabsList>
        {data?.personal && <TabsTrigger value="personal">내 활동</TabsTrigger>}
        <TabsTrigger value="team">팀 현황</TabsTrigger>
      </TabsList>

      {data?.personal && (
        <TabsContent value="personal" className="mt-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              title="총 데일리"
              value={data.personal.totalDailies}
              description="게시된 데일리 수"
            />
            <StatCard
              title="연속 작성"
              value={`${data.personal.streak}일`}
              description="연속으로 작성한 날"
            />
            <StatCard
              title="이번 주"
              value={data.personal.thisWeekCount}
              description="이번 주 작성 수"
            />
            <StatCard
              title="초안"
              value={data.personal.draftCount}
              description="미게시 초안 수"
            />
          </div>
        </TabsContent>
      )}

      <TabsContent value="team" className="mt-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard
            title="전체 데일리"
            value={data?.team.totalDailies ?? 0}
            description="팀 전체 게시된 데일리"
          />
          <StatCard
            title="참여자"
            value={`${data?.team.participantCount ?? 0}명`}
            description="데일리를 작성한 멤버"
          />
          <StatCard
            title="이번 주"
            value={data?.team.thisWeekCount ?? 0}
            description="이번 주 전체 작성 수"
          />
        </div>

        {(data?.team.topContributors?.length ?? 0) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Top 기여자
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.team.topContributors.map((contributor, i) => (
                  <div
                    key={contributor.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium">
                        {contributor.name}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {contributor.count}건
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
