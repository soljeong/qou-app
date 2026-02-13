import Link from "next/link";
import Image from "next/image";

export function Header() {
    return (
        <header className="fixed top-0 w-full z-10 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md print:hidden">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-3">
                        <Image
                            src="/logo_w.png"
                            alt="Logo"
                            width={198}
                            height={32}
                            className="dark:invert-0 invert"
                        />
                    </Link>
                </div>
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Link href="/quotes" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        견적서 관리
                    </Link>
                </nav>
                <div className="flex items-center gap-4">
                    <Link href="/quotes/new" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-sm shadow-blue-200 dark:shadow-none">
                        새 견적서
                    </Link>
                </div>
            </div>
        </header>
    );
}
