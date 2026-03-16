// CLI 인증 페이지 — 로그인 후 세션 토큰을 표시
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CliAuthPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getToken() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("로그인이 필요합니다");
        setLoading(false);
        return;
      }

      // access_token과 refresh_token을 하나의 문자열로 결합
      const tokenData = JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      setToken(btoa(tokenData));
      setLoading(false);
    }

    getToken();
  }, []);

  const handleCopy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <p className="text-muted-foreground">토큰 생성 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-foreground">CLI 인증</h1>
          <p className="mt-4 text-muted-foreground">{error}</p>
          <a
            href="/login?redirectTo=/cli/auth"
            className="mt-4 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            로그인
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-foreground">CLI 인증 토큰</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          아래 토큰을 복사하여 터미널에 붙여넣으세요.
        </p>

        <div className="mt-6 rounded-lg border border-border bg-muted p-4">
          <code className="block break-all text-xs text-foreground">
            {token}
          </code>
        </div>

        <button
          onClick={handleCopy}
          className="mt-4 w-full rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          {copied ? "복사됨!" : "토큰 복사"}
        </button>

        <div className="mt-6 rounded-lg border border-border p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">사용법</p>
          <p className="mt-2">
            Claude Code에서 <code className="text-foreground">/hearim-push</code> 실행 시
            토큰 입력을 요청하면 위 토큰을 붙여넣으세요.
          </p>
          <p className="mt-1">
            토큰은 <code className="text-foreground">~/.hearim-session</code>에 저장되어
            이후 자동으로 사용됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
