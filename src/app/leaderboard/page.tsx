"use client";

import { createClient } from "@/lib/supabase/client";
import Bubbles from "@/components/Bubbles";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";

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
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-8 relative z-10">
        <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2 animate-in">🏆 주간 리더보드</h1>
        <p className="text-[#6b7094] mb-8 animate-in">이번 주 가장 열심히 한 사람들</p>

        <div className="card overflow-hidden animate-in animate-in-delay-1">
          {loading ? (
            <p className="text-center py-12 text-[#6b7094]">로딩 중...</p>
          ) : entries.length === 0 ? (
            <p className="text-center py-12 text-[#6b7094]">아직 이번 주 활동이 없습니다</p>
          ) : (
            entries.map((entry, i) => (
              <div key={entry.user_id}
                className={`flex items-center gap-4 px-6 py-5 border-b border-[#f0f1f5] last:border-b-0 ${
                  i === 0 ? "bg-[#fefce8]" : ""
                }`}>
                <span className="w-10 text-center text-xl">
                  {i < 3 ? medals[i] : <span className="text-[#6b7094] text-base font-semibold">{i + 1}</span>}
                </span>
                <span className="flex-1 font-semibold text-[#1a1d2e]">{entry.nickname}</span>
                <span className="text-sm font-bold text-[#1b2559] bg-[#f0f1f5] px-3 py-1.5 rounded-full">{entry.weekly_xp} XP</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
