"use client";

import { createClient } from "@/lib/supabase/client";
import { levelProgress, xpForNextLevel } from "@/lib/xp";
import MissionList from "@/components/MissionList";
import GrassCalendar from "@/components/GrassCalendar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Profile {
  nickname: string;
  total_xp: number;
  level: number;
  current_streak: number;
  max_streak: number;
}

interface Quest {
  id: string;
  title: string;
  target_date: string;
  category: string;
  is_completed: boolean;
}

interface Mission {
  id: string;
  title: string;
  xp_reward: number;
  is_completed: boolean;
  quest_id: string;
  date: string;
}

interface ActivityDay {
  date: string;
  missions_completed: number;
}

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [todayMissions, setTodayMissions] = useState<Mission[]>([]);
  const [activities, setActivities] = useState<ActivityDay[]>([]);
  const [todayXP, setTodayXP] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const [profileRes, questsRes, missionsRes, activityRes, todayActivityRes] = await Promise.all([
      supabase.from("users").select("*").eq("id", user.id).single(),
      supabase.from("quests").select("*").eq("user_id", user.id).eq("is_completed", false).order("target_date"),
      supabase.from("missions").select("*").eq("user_id", user.id).eq("date", today).order("created_at"),
      supabase.from("activity_log").select("date, missions_completed").eq("user_id", user.id).gte("date", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),
      supabase.from("activity_log").select("xp_earned").eq("user_id", user.id).eq("date", today).single(),
    ]);

    setProfile(profileRes.data);
    setQuests(questsRes.data ?? []);
    setTodayMissions(missionsRes.data ?? []);
    setActivities(activityRes.data ?? []);
    setTodayXP(todayActivityRes.data?.xp_earned ?? 0);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0] text-[#9CA3AF]">로딩 중...</div>;
  }

  const completedToday = todayMissions.filter((m) => m.is_completed).length;
  const progress = levelProgress(profile?.total_xp ?? 0);
  const nextLevelXP = xpForNextLevel(profile?.level ?? 1);

  const categoryEmoji: Record<string, string> = {
    "공부": "📚", "운동": "💪", "재테크": "💰", "자기계발": "🌱", "기타": "⚡",
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* 상단 바 */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#2D2D3F]">⚔️ QuestDay</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#7C5CFC]">
              Lv.{profile?.level ?? 1}
            </span>
            <button onClick={handleLogout} className="text-xs text-[#9CA3AF] hover:text-[#2D2D3F]">
              로그아웃
            </button>
          </div>
        </div>

        {/* 레벨 & XP 카드 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-bold text-[#2D2D3F]">Lv.{profile?.level ?? 1} {profile?.nickname ?? ""}</span>
            <span className="text-[#9CA3AF]">{profile?.total_xp ?? 0} / {nextLevelXP} XP</span>
          </div>
          <div className="h-3 bg-[#F3F4F6] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #7C5CFC, #FF6B9D)" }}
            />
          </div>
        </div>

        {/* 스트릭 배너 */}
        <div className="rounded-2xl p-5 shadow-sm text-white"
             style={{ background: "linear-gradient(135deg, #7C5CFC, #FF6B9D)" }}>
          <p className="text-2xl font-bold">
            🔥 {profile?.current_streak ?? 0}일 연속!
          </p>
          <p className="text-sm opacity-80 mt-1">최대 기록: {profile?.max_streak ?? 0}일</p>
        </div>

        {/* 오늘의 미션 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#2D2D3F]">📋 오늘의 미션</h2>
            <span className="text-sm text-[#9CA3AF]">{completedToday}/{todayMissions.length}</span>
          </div>
          {todayMissions.length > 0 ? (
            <MissionList
              missions={todayMissions}
              currentStreak={profile?.current_streak ?? 0}
              todayXP={todayXP}
              onUpdate={loadAll}
            />
          ) : (
            <p className="text-center text-[#9CA3AF] py-4 text-sm">퀘스트에서 미션을 추가하세요</p>
          )}
        </div>

        {/* 잔디 캘린더 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-[#2D2D3F] mb-3">🗓️ 잔디 캘린더</h2>
          <GrassCalendar activities={activities} />
        </div>

        {/* 진행중인 퀘스트 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-[#2D2D3F] mb-3">⚔️ 진행중인 퀘스트</h2>
          <div className="space-y-2">
            {quests.map((quest) => {
              const dDay = Math.ceil((new Date(quest.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <Link
                  key={quest.id}
                  href={`/quest/${quest.id}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF8F0] hover:bg-[#F5F0E8] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{categoryEmoji[quest.category] ?? "⚡"}</span>
                    <div>
                      <p className="font-medium text-sm text-[#2D2D3F]">{quest.title}</p>
                      <span className="text-xs text-[#9CA3AF]">{quest.category}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#7C5CFC]">
                    {dDay > 0 ? `D-${dDay}` : dDay === 0 ? "D-Day!" : `D+${Math.abs(dDay)}`}
                  </span>
                </Link>
              );
            })}
          </div>
          <Link
            href="/quest/new"
            className="block mt-3 text-center py-3 rounded-2xl border-2 border-dashed border-[#7C5CFC]/30 text-[#7C5CFC] hover:bg-[#7C5CFC]/5 transition-colors text-sm font-medium"
          >
            + 새 퀘스트 추가
          </Link>
        </div>

        {/* 리더보드 링크 */}
        <Link
          href="/leaderboard"
          className="block bg-white rounded-2xl p-4 shadow-sm text-center font-medium text-[#FBBD23] hover:bg-[#FBBD23]/5 transition-colors"
        >
          🏆 주간 리더보드 보기
        </Link>
      </div>
    </div>
  );
}
