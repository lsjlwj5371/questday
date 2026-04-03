"use client";

import { createClient } from "@/lib/supabase/client";
import { levelProgress, xpForNextLevel } from "@/lib/xp";
import MissionList from "@/components/MissionList";
import GrassCalendar from "@/components/GrassCalendar";
import Bubbles from "@/components/Bubbles";
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#6b7094]">로딩 중...</div>;

  const completedToday = todayMissions.filter((m) => m.is_completed).length;
  const progress = levelProgress(profile?.total_xp ?? 0);
  const nextLevelXP = xpForNextLevel(profile?.level ?? 1);
  const categoryEmoji: Record<string, string> = { "공부": "📚", "운동": "💪", "재테크": "💰", "자기계발": "🌱", "기타": "⚡" };

  return (
    <div className="min-h-screen relative">
      <Bubbles />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5 relative z-10">

        {/* 상단 바 */}
        <div className="flex items-center justify-between animate-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1b2559] flex items-center justify-center">
              <span className="text-white text-sm">⚔️</span>
            </div>
            <span className="font-bold text-[#1a1d2e]">QuestDay</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-[#1b2559] bg-white px-3 py-1.5 rounded-full border border-[#e2e4ed]">
              Lv.{profile?.level ?? 1}
            </span>
            <button onClick={handleLogout} className="text-xs text-[#6b7094] hover:text-[#1a1d2e]">로그아웃</button>
          </div>
        </div>

        {/* 히어로 + 스트릭 */}
        <div className="animate-in animate-in-delay-1">
          <h2 className="text-3xl font-bold text-[#1a1d2e] leading-tight mb-2">
            {(profile?.current_streak ?? 0) > 0
              ? <>🔥 {profile?.current_streak}일 연속<br/>달성 중이에요!</>
              : <>오늘부터<br/>시작해볼까요?</>
            }
          </h2>
          <p className="text-[#6b7094]">최대 기록 {profile?.max_streak ?? 0}일 · {profile?.total_xp ?? 0} XP</p>
        </div>

        {/* 레벨 프로그레스 */}
        <div className="card p-5 animate-in animate-in-delay-2">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="font-semibold text-[#1a1d2e]">레벨 {profile?.level ?? 1}</span>
            <span className="text-[#6b7094]">{profile?.total_xp ?? 0} / {nextLevelXP} XP</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* 오늘의 미션 */}
        <div className="card p-5 animate-in animate-in-delay-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1a1d2e]">오늘의 미션</h3>
            <span className="text-sm text-[#6b7094] bg-[#f0f1f5] px-2.5 py-1 rounded-full">
              {completedToday}/{todayMissions.length}
            </span>
          </div>
          {todayMissions.length > 0 ? (
            <MissionList missions={todayMissions} currentStreak={profile?.current_streak ?? 0} todayXP={todayXP} onUpdate={loadAll} />
          ) : (
            <p className="text-center text-[#6b7094] py-6 text-sm">퀘스트에서 미션을 추가하세요</p>
          )}
        </div>

        {/* 나의 데일리 기록 (잔디) */}
        <div className="card p-5 animate-in animate-in-delay-4">
          <h3 className="font-bold text-[#1a1d2e] mb-4">나의 데일리 기록</h3>
          <GrassCalendar activities={activities} />
        </div>

        {/* 진행중인 퀘스트 */}
        <div className="card p-5 animate-in">
          <h3 className="font-bold text-[#1a1d2e] mb-4">진행중인 퀘스트</h3>
          <div className="space-y-2">
            {quests.map((quest) => {
              const dDay = Math.ceil((new Date(quest.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <Link key={quest.id} href={`/quest/${quest.id}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#f7f8fa] hover:bg-[#eef0f5] transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{categoryEmoji[quest.category] ?? "⚡"}</span>
                    <div>
                      <p className="font-medium text-sm text-[#1a1d2e]">{quest.title}</p>
                      <span className="text-xs text-[#6b7094]">{quest.category}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#1b2559]">
                    {dDay > 0 ? `D-${dDay}` : dDay === 0 ? "D-Day!" : `D+${Math.abs(dDay)}`}
                  </span>
                </Link>
              );
            })}
          </div>
          <Link href="/quest/new"
            className="block mt-3 text-center py-3 rounded-2xl border-2 border-dashed border-[#e2e4ed] text-[#6b7094] hover:border-[#1b2559] hover:text-[#1b2559] transition-colors text-sm font-medium">
            + 새 퀘스트 추가
          </Link>
        </div>

        {/* 리더보드 */}
        <Link href="/leaderboard" className="block btn-primary text-center py-4 animate-in">
          🏆 주간 리더보드 보기
        </Link>
      </div>
    </div>
  );
}
