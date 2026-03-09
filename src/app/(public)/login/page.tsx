// 로그인 페이지 — GitHub OAuth로 회사 계정 로그인
"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GitHubIcon } from "@/components/icons/GitHubIcon";

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    // 미들웨어가 보내준 redirectTo를 콜백에 전달
    const redirectTo = searchParams.get("redirectTo") || "/";
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("redirectTo", redirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setError("로그인 중 문제가 발생했습니다. 다시 시도해주세요.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-hearim-border bg-white px-4 py-3 text-sm font-medium text-hearim-text transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
      >
        <GitHubIcon />
        {isLoading ? "로그인 중..." : "회사 계정으로 로그인"}
      </button>

      {error && (
        <p className="mt-4 text-center text-sm text-red-500">{error}</p>
      )}

      <p className="mt-6 text-center text-xs text-hearim-muted">
        회사 GitHub 계정으로 로그인해주세요
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-hearim-bg px-4">
      <div className="w-full max-w-sm">
        {/* 타이틀 — 카드 바깥 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-hearim-text">헤아림</h1>
          <p className="mt-2 text-sm text-hearim-muted">
            메타인지 스터디 플랫폼
          </p>
        </div>

        {/* 로그인 카드 */}
        <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-900">
          <Suspense fallback={<div className="h-20" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
