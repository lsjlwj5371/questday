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

  useEffect(() => {
    loadAll();
  }, []);

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

    // 스트릭 계산
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const { data: yesterdayActivity } = await supabase
      .from("activity_log")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", yesterdayStr)
      .single();

    let streak = profileRes.data?.current_streak ?? 0;
    // 오늘 활동이 있고, 어제 활동이 없으면 → 스트릭은 오늘부터 1
    // 어제 활동이 있으면 → 기존 스트릭 유지
    if (!yesterdayActivity && todayActivityRes.data) {
      // 어제 안 했지만 오늘은 함 → 스트릭 1부터 다시
      if (streak > 1) {
        streak = 1;
        await supabase.from("users").update({ current_streak: 1 }).eq("id", user.id);
      }
    }

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
    return <div className="min-h-screen flex items-center justify-center text-gray-400">로딩 중...</div>;
  }

  const completedToday = todayMissions.filter((m) => m.is_completed).length;
  const progress = levelProgress(profile?.total_xp ?? 0);
  const nextLevelXP = xpForNextLevel(profile?.level ?? 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* 상단 바 */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">QuestDay</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              Lv.{profile?.level ?? 1} · {profile?.total_xp ?? 0} XP
            </span>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">
              로그아웃
            </button>
          </div>
        </div>

        {/* 레벨 프로그레스 바 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium">Lv.{profile?.level ?? 1}</span>
            <span className="text-gray-400">{profile?.total_xp ?? 0} / {nextLevelXP} XP</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 스트릭 배너 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-lg font-medium">
            🔥 {profile?.current_streak ?? 0}일 연속 달성 중!
          </p>
          <p className="text-xs text-gray-400 mt-1">최대 기록: {profile?.max_streak ?? 0}일</p>
        </div>

        {/* 오늘의 미션 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">오늘의 미션</h2>
            <span className="text-sm text-gray-400">{completedToday}/{todayMissions.length} 완료</span>
          </div>
          {todayMissions.length > 0 ? (
            <MissionList
              missions={todayMissions}
              currentStreak={profile?.current_streak ?? 0}
              todayXP={todayXP}
              onUpdate={loadAll}
            />
          ) : (
            <p className="text-center text-gray-300 py-4 text-sm">퀘스트에서 미션을 추가하세요</p>
          )}
        </div>

        {/* 잔디 캘린더 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold mb-3">잔디 캘린더</h2>
          <GrassCalendar activities={activities} />
        </div>

        {/* 진행중인 퀘스트 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold mb-3">진행중인 퀘스트</h2>
          <div className="space-y-2">
            {quests.map((quest) => {
              const dDay = Math.ceil((new Date(quest.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <Link
                  key={quest.id}
                  href={`/quest/${quest.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <span className="text-xs text-gray-400">{quest.category}</span>
                    <p className="font-medium text-sm">{quest.title}</p>
                  </div>
                  <span className="text-sm font-bold text-indigo-500">
                    {dDay > 0 ? `D-${dDay}` : dDay === 0 ? "D-Day!" : `D+${Math.abs(dDay)}`}
                  </span>
                </Link>
              );
            })}
          </div>
          <Link
            href="/quest/new"
            className="block mt-3 text-center py-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-400 transition-colors text-sm"
          >
            + 새 퀘스트 추가
          </Link>
        </div>
        {/* 리더보드 링크 */}
        <Link
          href="/leaderboard"
          className="block bg-white rounded-2xl p-4 shadow-sm text-center font-medium text-indigo-500 hover:bg-indigo-50 transition-colors"
        >
          🏆 주간 리더보드 보기
        </Link>
      </div>
    </div>
  );
}
