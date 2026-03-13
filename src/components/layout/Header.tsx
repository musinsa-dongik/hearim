/**
 * 글로벌 Header 컴포넌트 (Client Component)
 * - 로고: "헤아림" → / 링크
 * - 네비게이션: 데일리, 위클리, 검색 (현재 경로 하이라이트)
 * - 인증: user prop으로 로그인/로그아웃 분기
 * - 모바일: 햄버거 메뉴 토글 (md 브레이크포인트)
 * - sticky top-0 + backdrop blur
 */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const NAV_ITEMS = [
  { label: "데일리", href: "/daily" },
  { label: "위클리", href: "/weekly" },
  { label: "검색", href: "/search" },
] as const;

export default function Header({ user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh(); // 서버 컴포넌트(HeaderWrapper)가 다시 실행되어 user=null로 갱신
  };

  return (
    <header className="sticky top-0 z-50 border-b border-hearim-border bg-hearim-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* 로고 */}
        <Link href="/" className="text-lg font-bold text-hearim-text">
          헤아림
        </Link>

        {/* 데스크톱 네비게이션 */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ label, href }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-hearim-primary text-hearim-bg"
                    : "text-hearim-muted hover:text-hearim-text"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* 인증 + 테마 + 모바일 토글 */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/dashboard"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname.startsWith("/dashboard")
                    ? "bg-hearim-primary text-hearim-bg"
                    : "text-hearim-muted hover:text-hearim-text"
                }`}
              >
                대시보드
              </Link>
              <Link
                href="/daily/drafts"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname.startsWith("/daily/drafts")
                    ? "bg-hearim-primary text-hearim-bg"
                    : "text-hearim-muted hover:text-hearim-text"
                }`}
              >
                내 초안
              </Link>
              <span className="text-sm text-hearim-muted">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-hearim-muted transition-colors hover:text-hearim-text"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-lg bg-hearim-primary px-3 py-1.5 text-sm font-medium text-hearim-bg transition-colors hover:opacity-80 md:block"
            >
              로그인
            </Link>
          )}

          {/* 햄버거 버튼 (모바일) */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-hearim-muted hover:text-hearim-text md:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="메뉴 열기"
          >
            {mobileOpen ? (
              // X 아이콘
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // 햄버거 아이콘
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <nav className="border-t border-hearim-border px-4 pb-3 pt-2 md:hidden">
          {NAV_ITEMS.map(({ label, href }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-hearim-primary text-hearim-bg"
                    : "text-hearim-muted hover:text-hearim-text"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <div className="mt-2 border-t border-hearim-border pt-2">
            {user ? (
              <div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname.startsWith("/dashboard")
                      ? "bg-hearim-primary text-hearim-bg"
                      : "text-hearim-muted hover:text-hearim-text"
                  }`}
                >
                  대시보드
                </Link>
                <Link
                  href="/daily/drafts"
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname.startsWith("/daily/drafts")
                      ? "bg-hearim-primary text-hearim-bg"
                      : "text-hearim-muted hover:text-hearim-text"
                  }`}
                >
                  내 초안
                </Link>
                <span className="block px-3 py-2 text-sm text-hearim-muted">
                  {user.email}
                </span>
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-hearim-muted hover:text-hearim-text"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-hearim-primary"
              >
                로그인
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
