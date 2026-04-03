"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface NavbarProps {
  level?: number;
}

export default function Navbar({ level }: NavbarProps) {
  const supabase = createClient();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav className="relative z-10 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
      <Link href="/dashboard" className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1b2559] flex items-center justify-center">
          <span className="text-white text-xs">⚔️</span>
        </div>
        <span className="font-bold text-[#1a1d2e]">QuestDay</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/leaderboard" className="text-sm text-[#6b7094] hover:text-[#1a1d2e] transition-colors">리더보드</Link>
        {level && (
          <span className="text-sm font-semibold text-[#1b2559] bg-white px-3 py-1.5 rounded-full border border-[#e2e4ed]">
            Lv.{level}
          </span>
        )}
        <button onClick={handleLogout} className="text-sm text-[#6b7094] hover:text-[#1a1d2e] transition-colors">로그아웃</button>
      </div>
    </nav>
  );
}
