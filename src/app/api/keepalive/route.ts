import { NextResponse } from "next/server";

export async function GET() {
  // Supabase 비활성 방지 핑
  // TODO: Supabase 연동 후 실제 쿼리 실행
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
