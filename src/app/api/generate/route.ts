import { NextResponse } from "next/server";

export async function POST() {
  // TODO: Gemini 2.5 Flash 연동
  return NextResponse.json(
    { message: "Gemini API 연동 예정" },
    { status: 501 }
  );
}
