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
    <div className="min-h-screen relative overflow-hidden">
      <Bubbles />

      {/* 네비게이션 */}
      <nav className="relative z-10 px-5 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1b2559] flex items-center justify-center">
            <span className="text-white text-xs">⚔️</span>
          </div>
          <span className="font-bold text-[#1a1d2e] text-sm">QuestDay</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/leaderboard" className="text-xs text-[#6b7094] hover:text-[#1a1d2e]">리더보드</Link>
          <span className="text-xs font-semibold text-[#1b2559] bg-white px-2.5 py-1 rounded-full border border-[#e2e4ed]">
            Lv.{profile?.level ?? 1}
          </span>
          <button onClick={handleLogout} className="text-xs text-[#6b7094] hover:text-[#1a1d2e]">로그아웃</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-5 pb-16 relative z-10">

        {/* ========== 히어로 섹션 ========== */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">

          {/* 좌측: 큰 메시지 (3칸) */}
          <div className="md:col-span-3 pt-4 md:pt-10 animate-in">
            <h1 className="text-3xl md:text-[42px] font-bold text-[#1a1d2e] leading-[1.25] mb-4 tracking-tight">
              {(profile?.current_streak ?? 0) > 0
                ? <>여기까지 온 거,<br/>이미 절반은<br/>하신 거예요</>
                : <>목표를 세우면,<br/>매일이<br/>달라집니다</>
              }
            </h1>
            <p className="text-[#6b7094] text-base leading-relaxed mb-6">
              {(profile?.current_streak ?? 0) > 0
                ? <>🔥 {profile?.current_streak}일 연속 달성 중! 이제 남은 건 하나.<br/>매일 꾸준히 미션을 클리어하는 것뿐입니다.</>
                : <>어려운 결정은 끝났습니다. 이제 남은 건 하나.<br/>매일 꾸준히 미션을 클리어하는 것뿐입니다.</>
              }
            </p>
            <Link href="/quest/new" className="btn-gradient-border inline-block text-sm">
              새 퀘스트 시작하기 →
            </Link>
            <p className="text-[#6b7094] text-sm mt-4">
              최대 기록 {profile?.max_streak ?? 0}일 · 총 {profile?.total_xp ?? 0} XP
            </p>
          </div>

          {/* 우측: 데일리 기록 카드 (2칸) */}
          <div className="md:col-span-2 animate-in animate-in-delay-2">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#1a1d2e] text-sm">📊 나의 데일리 기록</h2>
                <span className="text-[10px] font-semibold text-white bg-[#1b2559] px-2.5 py-1 rounded-full">
                  Day {profile?.current_streak ?? 0} 진행 중
                </span>
              </div>
              <GrassCalendar activities={activities} />
              <div className="mt-5">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-xs text-[#6b7094]">
                  <span>전체 진행률 {Math.round(progress)}%</span>
                  <span>다음 레벨까지 {nextLevelXP - (profile?.total_xp ?? 0)} XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== 미션 + 퀘스트 ========== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* 오늘의 미션 */}
          <div className="card p-5 animate-in animate-in-delay-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#1a1d2e]">오늘의 미션</h2>
              <span className="text-xs text-[#6b7094] bg-[#f0f1f5] px-2.5 py-1 rounded-full">
                {completedToday}/{todayMissions.length} 완료
              </span>
            </div>
            {todayMissions.length > 0 ? (
              <MissionList missions={todayMissions} currentStreak={profile?.current_streak ?? 0} todayXP={todayXP} onUpdate={loadAll} />
            ) : (
              <div className="text-center py-8">
                <p className="text-3xl mb-3">📋</p>
                <p className="text-[#6b7094] text-sm">아직 오늘의 미션이 없습니다</p>
                <p className="text-[#b0b3c4] text-xs mt-1">퀘스트를 만들면 자동으로 생성됩니다</p>
              </div>
            )}
          </div>

          {/* 진행중인 퀘스트 */}
          <div className="card p-5 animate-in animate-in-delay-4">
            <h2 className="font-bold text-[#1a1d2e] mb-4">진행중인 퀘스트</h2>
            <div className="space-y-2">
              {quests.map((quest) => {
                const dDay = Math.ceil((new Date(quest.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const questMissions = todayMissions.filter(m => m.quest_id === quest.id);
                const questCompleted = questMissions.filter(m => m.is_completed).length;
                return (
                  <Link key={quest.id} href={`/quest/${quest.id}`}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f7f8fa] hover:bg-[#eef0f5] transition-all group">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{categoryEmoji[quest.category] ?? "⚡"}</span>
                      <div>
                        <p className="font-medium text-sm text-[#1a1d2e] group-hover:text-[#1b2559]">{quest.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-[#6b7094]">{quest.category}</span>
                          {questMissions.length > 0 && (
                            <span className="text-[11px] text-[#6b7094]">· 오늘 {questCompleted}/{questMissions.length}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#1b2559] bg-white px-2.5 py-1 rounded-full border border-[#e2e4ed]">
                      {dDay > 0 ? `D-${dDay}` : dDay === 0 ? "D-Day!" : `D+${Math.abs(dDay)}`}
                    </span>
                  </Link>
                );
              })}
              {quests.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-3xl mb-3">⚔️</p>
                  <p className="text-[#6b7094] text-sm">아직 진행중인 퀘스트가 없습니다</p>
                </div>
              )}
            </div>
            <Link href="/quest/new"
              className="block mt-3 text-center py-3 rounded-2xl border-2 border-dashed border-[#e2e4ed] text-[#6b7094] hover:border-[#1b2559] hover:text-[#1b2559] transition-colors text-sm font-medium">
              + 새 퀘스트 추가
            </Link>
          </div>
        </div>

        {/* 리더보드 */}
        <div className="mt-6 animate-in">
          <Link href="/leaderboard" className="block btn-primary text-center py-3.5 rounded-2xl text-sm">
            🏆 주간 리더보드 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
