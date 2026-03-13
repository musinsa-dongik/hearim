import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { gemini } from "@/lib/gemini";

// Vercel Cron: 매주 월요일 00:00 UTC (= 09:00 KST)
// 수동 호출도 가능 (CRON_SECRET 헤더 필요)

export async function GET(request: Request) {
  // Vercel Cron 인증 (프로덕션에서만)
  if (process.env.VERCEL) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();

  // 지난주 월~일 범위 계산
  const now = new Date();
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7);
  lastMonday.setHours(0, 0, 0, 0);

  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);

  const weekStart = lastMonday.toISOString().slice(0, 10);
  const weekEnd = lastSunday.toISOString().slice(0, 10);

  // 해당 주차 계산
  const startOfYear = new Date(lastMonday.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((lastMonday.getTime() - startOfYear.getTime()) / 86400000 + 1) / 7
  );

  // 이미 생성된 위클리가 있는지 확인
  const { data: existing } = await admin
    .from("weeklies")
    .select("id")
    .eq("week_start", weekStart)
    .eq("week_end", weekEnd)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({
      message: "이미 생성된 위클리가 있습니다",
      id: existing[0].id,
    });
  }

  // 지난주 발행된 데일리 조회
  const { data: dailies, error } = await admin
    .from("dailies")
    .select("id, title, date, content, summary, author_id")
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .eq("status", "published")
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!dailies || dailies.length === 0) {
    return NextResponse.json({
      message: "지난주 발행된 데일리가 없습니다",
      week: `${weekStart} ~ ${weekEnd}`,
    });
  }

  // 작성자 이름 조회
  const authorIds = [...new Set(dailies.map((d) => d.author_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, name")
    .in("id", authorIds);

  const profileMap = new Map(
    (profiles ?? []).map((p: { id: string; name: string }) => [p.id, p.name])
  );

  const contributors = authorIds
    .map((id) => profileMap.get(id) ?? "Unknown")
    .filter((v, i, a) => a.indexOf(v) === i);

  // Gemini에 보낼 프롬프트 구성
  const dailyContents = dailies
    .map(
      (d) =>
        `## ${d.date} - ${profileMap.get(d.author_id) ?? "Unknown"}\n\n${d.content}`
    )
    .join("\n\n---\n\n");

  const prompt = `당신은 "헤아림" 메타인지 스터디의 주간 리포트 작성자입니다.
아래는 이번 주(${weekStart} ~ ${weekEnd}) 팀원들의 데일리 학습 기록입니다.

${dailyContents}

---

위 데일리들을 분석하여 아래 형식으로 주간 리포트를 작성하세요.

### 작성 규칙
- 이모지를 사용하지 마세요
- 과장 없이 간결하고 구체적으로 작성하세요
- 개별 데일리를 단순 나열하지 말고, 상위 개념으로 묶어서 정리하세요
- 코드 예시가 필요하면 포함하세요

### 출력 형식 (마크다운)

## 이번 주 핵심 테마

[데일리 배움 카드들에서 공통 테마 2-4개를 추출하여 설명. 각 테마별 3-5문장.]

---

## 테마별 배움 정리

### 1. [테마 이름]

[해당 테마에 속하는 배움들을 통합 정리. 어떤 맥락에서 배웠고, 핵심 인사이트가 무엇인지.]

**핵심 패턴:**
- [코드 패턴이나 설계 원칙]

---

### 2. [테마 이름]

[동일 구조]

---

## 질의 추적

### 해결된 질문
- [이전 데일리의 "추가 학습 질의"가 이번 주에 답을 찾은 것들]

### 미해결 / 다음 주로
- [아직 답을 못 찾거나 새로 생긴 질문들]

---

## 이번 주 성장 포인트

[팀 전체의 메타인지적 관점에서 이번 주 학습을 정리. 2-3문장.]`;

  const result = await gemini.generateContent(prompt);
  const content = result.response.text();

  // summary 추출: "이번 주 성장 포인트" 섹션
  const summaryMatch = content.match(
    /## 이번 주 성장 포인트\s*\n([\s\S]*?)$/
  );
  const summary = summaryMatch
    ? summaryMatch[1].trim()
    : `${weekStart} ~ ${weekEnd} 주간 요약`;

  // weeklies 테이블에 INSERT
  const { data: weekly, error: insertError } = await admin
    .from("weeklies")
    .insert({
      title: `헤아림 위클리: ${weekStart} ~ ${weekEnd}`,
      week_number: weekNumber,
      week_start: weekStart,
      week_end: weekEnd,
      content,
      summary,
      daily_count: dailies.length,
      contributors,
      status: "draft",
    })
    .select("id, title")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "위클리 생성 완료 (draft)",
    id: weekly.id,
    title: weekly.title,
    dailyCount: dailies.length,
    contributors,
    week: `${weekStart} ~ ${weekEnd}`,
  });
}
