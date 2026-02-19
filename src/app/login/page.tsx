import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

type LoginSearchParams = {
  callbackUrl?: string | string[];
};

interface LoginPageProps {
  searchParams: Promise<LoginSearchParams>;
}

function resolveCallbackUrl(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw) {
    return "/quotes";
  }

  return raw.startsWith("/") ? raw : "/quotes";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = resolveCallbackUrl(params.callbackUrl);
  const session = await auth();

  if (session?.user) {
    redirect(callbackUrl);
  }

  async function loginWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: callbackUrl });
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          로그인
        </h1>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
          견적 관리 기능을 사용하려면 Google 계정으로 로그인해 주세요.
        </p>

        <form action={loginWithGoogle}>
          <Button type="submit" className="w-full">
            Google로 로그인
          </Button>
        </form>
      </div>
    </div>
  );
}
