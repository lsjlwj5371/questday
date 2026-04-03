"use client";

import { createClient } from "@/lib/supabase/client";
import { recommendMissions, recommendDailyMissions } from "@/lib/mission-recommend";
import Bubbles from "@/components/Bubbles";
import Navbar from "@/components/Navbar";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Quest { id: string; title: string; target_date: string; category: string; is_completed: boolean; }
interface Mission { id: string; title: string; xp_reward: number; is_completed: boolean; date: string; }

const categoryEmoji: Record<string, string> = { "공부": "📚", "운동": "💪", "재테크": "💰", "자기계발": "🌱", "기타": "⚡" };

export default function QuestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const questId = params.id as string;
  const [quest, setQuest] = useState<Quest | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [newMission, setNewMission] = useState("");
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [showRec, setShowRec] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: q } = await supabase.from("quests").select("*").eq("id", questId).single();
    const { data: m } = await supabase.from("missions").select("*").eq("quest_id", questId).eq("date", today).order("created_at");
    setQuest(q); setMissions(m ?? []); setLoading(false);
  }

  async function addMission(e: React.FormEvent) {
    e.preventDefault();
    if (!newMission.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("missions").insert({ quest_id: questId, user_id: user.id, title: newMission, date: today });
    setNewMission(""); loadData();
  }

  async function addRecommendedMission(title: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("missions").insert({ quest_id: questId, user_id: user.id, title, date: today });
    setRecommendations((prev) => prev.filter((r) => r !== title));
    loadData();
  }

  async function addAllRecommendations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("missions").insert(recommendations.map((title) => ({ quest_id: questId, user_id: user.id, title, date: today })));
    setRecommendations([]); setShowRec(false); loadData();
  }

  function generateRecommendations() {
    if (!quest) return;
    const daysLeft = Math.ceil((new Date(quest.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const recs = recommendMissions({ title: quest.title, category: quest.category, daysLeft });
    const existingTitles = missions.map((m) => m.title);
    setRecommendations(recs.filter((r) => !existingTitles.includes(r)));
    setShowRec(true);
  }

  async function regenerateTodayMissions() {
    if (!quest) return;
    if (!confirm("오늘의 미션을 모두 삭제하고 새로 생성할까요?\n(완료된 미션도 초기화됩니다)")) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 오늘 미션 전부 삭제
    await supabase.from("missions").delete().eq("quest_id", questId).eq("date", today);

    // 새 미션 생성 (랜덤 seed로 다른 조합)
    const daysLeft = Math.ceil((new Date(quest.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const newSeed = Date.now(); // 현재 시각 기반 → 매번 다른 조합
    const newMissions = recommendDailyMissions({ title: quest.title, category: quest.category, daysLeft }, newSeed);

    await supabase.from("missions").insert(
      newMissions.map((title) => ({ quest_id: questId, user_id: user.id, title, date: today }))
    );

    loadData();
  }

  async function deleteMission(missionId: string) { await supabase.from("missions").delete().eq("id", missionId); loadData(); }
  async function deleteQuest() { if (!confirm("이 퀘스트를 삭제할까요?")) return; await supabase.from("quests").delete().eq("id", questId); router.push("/dashboard"); }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#6b7094]">로딩 중...</div>;
  if (!quest) return <div className="min-h-screen flex items-center justify-center text-[#6b7094]">퀘스트를 찾을 수 없습니다</div>;

  const dDay = Math.ceil((new Date(quest.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const completedCount = missions.filter((m) => m.is_completed).length;

  return (
    <div className="min-h-screen relative">
      <Bubbles />
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pb-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* 좌측: 퀘스트 정보 + 히어로 */}
          <div className="pt-4 lg:pt-8 animate-in">
            <button onClick={() => router.push("/dashboard")} className="text-sm text-[#6b7094] hover:text-[#1a1d2e] mb-6 inline-block">← 대시보드</button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{categoryEmoji[quest.category] ?? "⚡"}</span>
              <span className="text-sm font-bold text-white bg-[#1b2559] px-3 py-1.5 rounded-full">
                {dDay > 0 ? `D-${dDay}` : dDay === 0 ? "D-Day!" : `D+${Math.abs(dDay)}`}
              </span>
            </div>

            <h1 className="text-4xl font-bold text-[#1a1d2e] leading-tight mb-3">{quest.title}</h1>
            <p className="text-[#6b7094] text-lg mb-6">{quest.target_date} · {quest.category}</p>

            {/* 진행률 */}
            <div className="card p-5 mb-4">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: missions.length > 0 ? `${(completedCount / missions.length) * 100}%` : '0%' }} />
              </div>
              <div className="flex justify-between mt-3 text-sm text-[#6b7094]">
                <span>전체 진행률 {missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 0}%</span>
                <span>남은 기간 {dDay > 0 ? `${dDay}일` : "종료"}</span>
              </div>
            </div>

            <button onClick={deleteQuest} className="text-sm text-[#b0b3c4] hover:text-red-500 transition-colors">퀘스트 삭제</button>
          </div>

          {/* 우측: 미션 관리 */}
          <div className="space-y-4 pt-4 lg:pt-8">
            {/* 오늘의 미션 */}
            <div className="card p-6 animate-in animate-in-delay-1">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-[#1a1d2e] text-lg">오늘의 미션</h2>
                <span className="text-sm text-[#6b7094] bg-[#f0f1f5] px-3 py-1 rounded-full">{completedCount}/{missions.length}</span>
              </div>

              <div className="space-y-2 mb-5">
                {missions.map((mission) => (
                  <div key={mission.id} className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                    mission.is_completed ? "bg-[#f0fdf4] border-[#d1fae5]" : "bg-[#f7f8fa] border-transparent"
                  }`}>
                    <span className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 text-xs ${
                      mission.is_completed ? "bg-[#1b2559] border-[#1b2559] text-white" : "border-[#d1d5e0]"
                    }`}>
                      {mission.is_completed && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    <span className={`flex-1 text-sm ${mission.is_completed ? "line-through text-[#6b7094]" : "text-[#1a1d2e]"}`}>{mission.title}</span>
                    <span className="text-xs font-semibold text-[#1b2559]">+{mission.xp_reward}</span>
                    {!mission.is_completed && (
                      <button onClick={() => deleteMission(mission.id)} className="text-[#d1d5e0] hover:text-red-400 text-sm">✕</button>
                    )}
                  </div>
                ))}
                {missions.length === 0 && <p className="text-center text-[#6b7094] py-8 text-sm">아직 미션이 없습니다</p>}
              </div>

              <form onSubmit={addMission} className="flex gap-2 mb-3">
                <input type="text" value={newMission} onChange={(e) => setNewMission(e.target.value)}
                  placeholder="미션 추가..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-[#f7f8fa] border border-[#e2e4ed] focus:outline-none focus:ring-2 focus:ring-[#1b2559]/20 focus:border-[#1b2559] text-sm text-[#1a1d2e] placeholder-[#b0b3c4] transition-all" />
                <button type="submit" className="btn-primary px-5 py-3 text-sm">추가</button>
              </form>

              <div className="flex gap-2">
                <button onClick={regenerateTodayMissions}
                  className="flex-1 py-3 rounded-2xl text-sm font-medium text-[#e07070] bg-[#fef2f2] hover:bg-[#fee2e2] transition-colors">
                  🔄 오늘 미션 다시 생성
                </button>
                <button onClick={generateRecommendations}
                  className="flex-1 py-3 rounded-2xl text-sm font-medium text-[#1b2559] bg-[#f0f1f5] hover:bg-[#e2e4ed] transition-colors">
                  ✨ 미션 추가 추천
                </button>
              </div>
            </div>

            {/* 추천 미션 */}
            {showRec && recommendations.length > 0 && (
              <div className="card p-6 animate-in">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-[#1a1d2e]">✨ 추천 미션</h3>
                  <button onClick={addAllRecommendations} className="text-xs font-semibold text-[#1b2559] hover:underline">전체 추가</button>
                </div>
                <p className="text-xs text-[#6b7094] mb-4">
                  {dDay > 30 ? "장기 목표에요. 꾸준히 할 수 있는 미션을 추천합니다." :
                   dDay > 7 ? "한 달 이내! 균형 잡힌 미션을 추천합니다." :
                   "마감이 가까워요! 집중 미션을 추천합니다."}
                </p>
                <div className="space-y-2">
                  {recommendations.map((rec) => (
                    <button key={rec} onClick={() => addRecommendedMission(rec)}
                      className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[#f7f8fa] hover:bg-[#eef0f5] transition-all text-left border border-transparent hover:border-[#1b2559]/20">
                      <span className="w-6 h-6 rounded-lg bg-[#1b2559]/10 flex items-center justify-center flex-shrink-0 text-xs text-[#1b2559] font-bold">+</span>
                      <span className="flex-1 text-sm text-[#1a1d2e]">{rec}</span>
                      <span className="text-xs text-[#6b7094]">추가</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => { setShowRec(false); setRecommendations([]); }}
                  className="w-full mt-3 text-center text-xs text-[#6b7094] hover:text-[#1a1d2e]">닫기</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
