/**
 * 글로벌 404 페이지 — 존재하지 않는 경로 접근 시 표시
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-4xl font-bold text-hearim-text">404</h2>
      <p className="text-sm text-hearim-muted">
        찾으시는 페이지가 존재하지 않습니다.
      </p>
      <Link
        href="/"
        className="rounded-lg border border-hearim-border px-4 py-2 text-sm font-medium text-hearim-text transition-colors hover:bg-hearim-border/30"
      >
        메인으로 돌아가기
      </Link>
    </div>
  );
}
