export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            로그인
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            스터디원 이메일로 Magic Link를 받아 로그인합니다.
          </p>
        </div>
        <p className="text-center text-sm text-zinc-400">
          Supabase Auth 연동 후 로그인 폼이 표시됩니다.
        </p>
      </div>
    </div>
  );
}
