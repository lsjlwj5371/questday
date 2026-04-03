"use client";

import { createClient } from "@/lib/supabase/client";
import { recommendMissions } from "@/lib/mission-recommend";
import Bubbles from "@/components/Bubbles";
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

  async function deleteMission(missionId: string) { await supabase.from("missions").delete().eq("id", missionId); loadData(); }
  async function deleteQuest() { if (!confirm("이 퀘스트를 삭제할까요?")) return; await supabase.from("quests").delete().eq("id", questId); router.push("/dashboard"); }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#6b7094]">로딩 중...</div>;
  if (!quest) return <div className="min-h-screen flex items-center justify-center text-[#6b7094]">퀘스트를 찾을 수 없습니다</div>;

  const dDay = Math.ceil((new Date(quest.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const completedCount = missions.filter((m) => m.is_completed).length;

  return (
    <div className="min-h-screen relative">
      <Bubbles />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-[#6b7094] hover:text-[#1a1d2e]">← 대시보드</button>
          <button onClick={deleteQuest} className="text-[#6b7094] hover:text-red-500 text-sm">삭제</button>
        </div>

        {/* 퀘스트 히어로 */}
        <div className="card p-6 animate-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">{categoryEmoji[quest.category] ?? "⚡"}</span>
            <span className="text-sm font-bold text-white bg-[#1b2559] px-3 py-1.5 rounded-full">
              {dDay > 0 ? `D-${dDay}` : dDay === 0 ? "D-Day!" : `D+${Math.abs(dDay)}`}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#1a1d2e]">{quest.title}</h2>
          <p className="text-sm text-[#6b7094] mt-1">{quest.target_date} · {quest.category}</p>

          {/* 진행률 */}
          <div className="mt-4">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: missions.length > 0 ? `${(completedCount / missions.length) * 100}%` : '0%' }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-[#6b7094]">
              <span>전체 진행률 {missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 0}%</span>
              <span>남은 기간 {dDay > 0 ? `${dDay}일` : "종료"}</span>
            </div>
          </div>
        </div>

        {/* 오늘의 미션 */}
        <div className="card p-5 animate-in animate-in-delay-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1a1d2e]">오늘의 미션</h3>
            <span className="text-sm text-[#6b7094] bg-[#f0f1f5] px-2.5 py-1 rounded-full">{completedCount}/{missions.length}</span>
          </div>

          <div className="space-y-2 mb-4">
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
            {missions.length === 0 && <p className="text-center text-[#6b7094] py-6 text-sm">아직 미션이 없습니다</p>}
          </div>

          <form onSubmit={addMission} className="flex gap-2 mb-3">
            <input type="text" value={newMission} onChange={(e) => setNewMission(e.target.value)}
              placeholder="미션 추가..."
              className="flex-1 px-4 py-3 rounded-2xl bg-[#f7f8fa] border border-[#e2e4ed] focus:outline-none focus:ring-2 focus:ring-[#1b2559]/20 focus:border-[#1b2559] text-sm text-[#1a1d2e] placeholder-[#6b7094] transition-all" />
            <button type="submit" className="btn-primary px-5 py-3 text-sm">추가</button>
          </form>

          <button onClick={generateRecommendations}
            className="w-full py-3 rounded-2xl text-sm font-medium text-[#1b2559] bg-[#f0f1f5] hover:bg-[#e2e4ed] transition-colors">
            ✨ 미션 추천받기
          </button>
        </div>

        {/* 추천 미션 */}
        {showRec && recommendations.length > 0 && (
          <div className="card p-5 animate-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[#1a1d2e]">✨ 추천 미션</h3>
              <button onClick={addAllRecommendations} className="text-xs font-semibold text-[#1b2559] hover:underline">전체 추가</button>
            </div>
            <p className="text-xs text-[#6b7094] mb-3">
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
  );
}
