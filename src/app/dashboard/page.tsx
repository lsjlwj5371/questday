"use client";

import { createClient } from "@/lib/supabase/client";
import { levelProgress, xpForNextLevel } from "@/lib/xp";
import MissionList from "@/components/MissionList";
import GrassCalendar from "@/components/GrassCalendar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Profile { nickname: string; total_xp: number; level: number; current_streak: number; max_streak: number; }
interface Quest { id: string; title: string; target_date: string; category: string; is_completed: boolean; }
interface Mission { id: string; title: string; xp_reward: number; is_completed: boolean; quest_id: string; date: string; }
interface ActivityDay { date: string; missions_completed: number; }

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

  async function handleLogout() { await supabase.auth.signOut(); router.push("/login"); }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#7c809a]">로딩 중...</div>;

  const completedToday = todayMissions.filter((m) => m.is_completed).length;
  const progress = levelProgress(profile?.total_xp ?? 0);
  const nextLevelXP = xpForNextLevel(profile?.level ?? 1);
  const categoryEmoji: Record<string, string> = { "공부": "📚", "운동": "💪", "재테크": "💰", "자기계발": "🌱", "기타": "⚡" };

  return (
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* 상단 바 */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#2e3347]">⚔️ QuestDay</h1>
          <div className="flex items-center gap-3">
            <span className="jelly-badge px-3 py-1 rounded-full text-sm font-bold text-[#5b7fd6]">
              Lv.{profile?.level ?? 1}
            </span>
            <button onClick={handleLogout} className="text-xs text-[#7c809a] hover:text-[#2e3347]">로그아웃</button>
          </div>
        </div>

        {/* 레벨 & XP */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="font-bold text-[#2e3347]">{profile?.nickname ?? ""}</span>
            <span className="text-[#7c809a]">{profile?.total_xp ?? 0} / {nextLevelXP} XP</span>
          </div>
          <div className="h-3 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full progress-shine transition-all duration-500"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #5b7fd6, #8ba4e8)" }}
            />
          </div>
        </div>

        {/* 스트릭 배너 */}
        <div className="rounded-3xl p-5 text-white"
             style={{
               background: "linear-gradient(145deg, #5b7fd6, #7b9ae8)",
               boxShadow: "0 8px 32px rgba(91, 127, 214, 0.3), inset 0 1px 1px rgba(255,255,255,0.3)"
             }}>
          <p className="text-2xl font-bold">🔥 {profile?.current_streak ?? 0}일 연속!</p>
          <p className="text-sm opacity-70 mt-1">최대 기록: {profile?.max_streak ?? 0}일</p>
        </div>

        {/* 오늘의 미션 */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#2e3347]">📋 오늘의 미션</h2>
            <span className="jelly-badge px-2 py-0.5 rounded-full text-xs text-[#7c809a]">{completedToday}/{todayMissions.length}</span>
          </div>
          {todayMissions.length > 0 ? (
            <MissionList missions={todayMissions} currentStreak={profile?.current_streak ?? 0} todayXP={todayXP} onUpdate={loadAll} />
          ) : (
            <p className="text-center text-[#7c809a] py-4 text-sm">퀘스트에서 미션을 추가하세요</p>
          )}
        </div>

        {/* 잔디 캘린더 */}
        <div className="glass rounded-3xl p-5">
          <h2 className="font-bold text-[#2e3347] mb-3">🗓️ 잔디 캘린더</h2>
          <GrassCalendar activities={activities} />
        </div>

        {/* 진행중인 퀘스트 */}
        <div className="glass rounded-3xl p-5">
          <h2 className="font-bold text-[#2e3347] mb-3">⚔️ 진행중인 퀘스트</h2>
          <div className="space-y-2">
            {quests.map((quest) => {
              const dDay = Math.ceil((new Date(quest.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <Link key={quest.id} href={`/quest/${quest.id}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/25 hover:bg-white/40 transition-all glass-hover">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{categoryEmoji[quest.category] ?? "⚡"}</span>
                    <div>
                      <p className="font-medium text-sm text-[#2e3347]">{quest.title}</p>
                      <span className="text-xs text-[#7c809a]">{quest.category}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#5b7fd6]">
                    {dDay > 0 ? `D-${dDay}` : dDay === 0 ? "D-Day!" : `D+${Math.abs(dDay)}`}
                  </span>
                </Link>
              );
            })}
          </div>
          <Link href="/quest/new"
            className="block mt-3 text-center py-3 rounded-2xl border-2 border-dashed border-white/40 text-[#5b7fd6] hover:bg-white/20 transition-colors text-sm font-medium">
            + 새 퀘스트 추가
          </Link>
        </div>

        {/* 리더보드 */}
        <Link href="/leaderboard"
          className="block glass rounded-3xl p-4 text-center font-medium text-[#f0c864] hover:bg-white/50 transition-all glass-hover">
          🏆 주간 리더보드 보기
        </Link>
      </div>
    </div>
  );
}
