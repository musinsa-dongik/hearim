import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          헤아림
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          내가 안다고 생각한 것을, 말로 헤아려보는 시간
        </p>

        <div className="flex gap-4">
          <Link
            href="/daily"
            className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            데일리 보기
          </Link>
          <Link
            href="/weekly"
            className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            위클리 보기
          </Link>
        </div>
      </main>
    </div>
  );
}
