"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface LeaderboardEntry {
  user_id: string;
  nickname: string;
  weekly_xp: number;
}

export default function LeaderboardPage() {
  const supabase = createClient();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("weekly_leaderboard").select("*");
      setEntries(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="text-[#9CA3AF] hover:text-[#2D2D3F]">
            ← 대시보드
          </Link>
          <h1 className="text-xl font-bold text-[#2D2D3F]">🏆 주간 리더보드</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <p className="text-center py-8 text-[#9CA3AF]">로딩 중...</p>
          ) : entries.length === 0 ? (
            <p className="text-center py-8 text-[#9CA3AF]">아직 이번 주 활동이 없습니다</p>
          ) : (
            entries.map((entry, i) => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 px-5 py-4 border-b border-[#FFF8F0] last:border-b-0 ${
                  i === 0 ? "bg-[#FBBD23]/10" : ""
                }`}
              >
                <span className="w-8 text-center text-lg">
                  {i < 3 ? medals[i] : <span className="text-[#9CA3AF] text-sm">{i + 1}</span>}
                </span>
                <span className="flex-1 font-medium text-[#2D2D3F]">{entry.nickname}</span>
                <span className="text-sm font-bold text-[#7C5CFC]">{entry.weekly_xp} XP</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
