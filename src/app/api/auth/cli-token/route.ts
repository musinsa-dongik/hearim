// CLI 토큰 발급 API — 로그인된 사용자의 세션 토큰을 반환
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json(
      { error: "로그인이 필요합니다" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  });
}
