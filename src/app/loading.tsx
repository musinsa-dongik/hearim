/**
 * 글로벌 로딩 페이지 — 페이지 전환 시 표시되는 스피너
 */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-hearim-border border-t-hearim-primary" />
    </div>
  );
}
