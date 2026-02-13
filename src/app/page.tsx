import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col h-full">

      {/* Hero Section */}
      <main className="flex-grow flex items-center justify-center pt-8 pb-12 px-6">
        <div className="text-center max-w-3xl mx-auto space-y-8">

          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 pb-2">
              견적서 관리를<br />더 쉽고 빠르게.
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              복잡한 견적 업무를 단순화하고, <br className="hidden md:block" />
              비즈니스 성장에 집중하세요.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            <Link
              href="/quotes"
              className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/20 hover:shadow-xl hover:-translate-y-0.5"
            >
              지금 시작하기
            </Link>
            <Link
              href="/quotes"
              className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              대시보드
            </Link>
          </div>

          <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">간편한 작성</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">직관적인 인터페이스로 누구나 쉽게 전문적인 견적서를 작성할 수 있습니다.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">체계적인 관리</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">모든 견적 이력을 한눈에 파악하고 효율적으로 관리하세요.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">PDF 내보내기</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">작성된 견적서를 깔끔한 PDF 파일로 즉시 변환하여 공유하세요.</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
