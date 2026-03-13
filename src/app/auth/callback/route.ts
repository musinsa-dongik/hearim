// Auth 콜백 — GitHub 로그인 완료 후 code를 세션 쿠키로 교환
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // GitHub가 보내준 일회용 인증 코드
  const code = searchParams.get("code");
  // 로그인 전에 가려던 페이지 (예: /daily/new)
  const redirectTo = searchParams.get("redirectTo") || "/";

  if (code) {
    const supabase = await createClient();
    // code를 Supabase 세션(쿠키)으로 교환
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 프로필 자동 생성: auth.users에는 있지만 profiles에 없을 때
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const admin = createAdminClient();
        const { data: profile } = await admin
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!profile) {
          const name =
            user.user_metadata?.full_name ||
            user.user_metadata?.user_name ||
            user.email?.split("@")[0] ||
            "Unknown";

          await admin.from("profiles").insert({
            id: user.id,
            name,
            email: user.email ?? null,
            avatar_url: user.user_metadata?.avatar_url ?? null,
          });
        }
      }

      // 성공 → 원래 가려던 페이지로 이동
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // 실패 → 로그인 페이지로 돌려보냄 (에러 표시)
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
