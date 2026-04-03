"use client";

import { createClient } from "@/lib/supabase/client";
import Bubbles from "@/components/Bubbles";
import { useEffect, useState } from "react";
import Link from "next/link";

interface LeaderboardEntry { user_id: string; nickname: string; weekly_xp: number; }

export default function LeaderboardPage() {
  const supabase = createClient();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("weekly_leaderboard").select("*");
      setEntries(data ?? []); setLoading(false);
    }
    load();
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen relative">
      <Bubbles />
      <div className="max-w-lg mx-auto px-4 py-6 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="text-[#6b7094] hover:text-[#1a1d2e]">← 대시보드</Link>
          <h1 className="text-xl font-bold text-[#1a1d2e]">🏆 주간 리더보드</h1>
        </div>

        <div className="card overflow-hidden animate-in">
          {loading ? (
            <p className="text-center py-10 text-[#6b7094]">로딩 중...</p>
          ) : entries.length === 0 ? (
            <p className="text-center py-10 text-[#6b7094]">아직 이번 주 활동이 없습니다</p>
          ) : (
            entries.map((entry, i) => (
              <div key={entry.user_id}
                className={`flex items-center gap-4 px-5 py-4 border-b border-[#f0f1f5] last:border-b-0 ${
                  i === 0 ? "bg-[#fefce8]" : ""
                }`}>
                <span className="w-8 text-center text-lg">
                  {i < 3 ? medals[i] : <span className="text-[#6b7094] text-sm font-medium">{i + 1}</span>}
                </span>
                <span className="flex-1 font-medium text-[#1a1d2e]">{entry.nickname}</span>
                <span className="text-sm font-bold text-[#1b2559]">{entry.weekly_xp} XP</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
