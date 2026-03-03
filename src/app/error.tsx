/**
 * 글로벌 에러 페이지 — 런타임 에러 발생 시 표시
 * error.tsx는 반드시 Client Component여야 한다.
 */
"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-bold text-hearim-text">
        문제가 발생했습니다
      </h2>
      <p className="text-sm text-hearim-muted">
        페이지를 불러오는 중 오류가 발생했습니다.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-hearim-primary px-4 py-2 text-sm font-medium text-hearim-bg transition-colors hover:opacity-80"
      >
        다시 시도
      </button>
    </div>
  );
}
