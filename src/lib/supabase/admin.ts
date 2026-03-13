import { createClient } from "@supabase/supabase-js";

// RLS를 우회하는 서버 전용 관리자 클라이언트
// auth 콜백에서 프로필 자동 생성 등 관리 작업에 사용
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
