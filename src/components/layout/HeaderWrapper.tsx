/**
 * Header를 감싸는 서버 컴포넌트
 * layout.tsx를 async로 만들지 않기 위해 auth 로직을 여기서 처리한다.
 */
import { createClient } from "@/lib/supabase/server";
import Header from "./Header";

export default async function HeaderWrapper() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <Header user={user} />;
}
