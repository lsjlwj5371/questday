"use client";

import { createClient } from "@/lib/supabase/client";
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

  async function deleteMission(missionId: string) {
    await supabase.from("missions").delete().eq("id", missionId); loadData();
  }

  async function deleteQuest() {
    if (!confirm("이 퀘스트를 삭제할까요?")) return;
    await supabase.from("quests").delete().eq("id", questId); router.push("/dashboard");
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#7c809a]">로딩 중...</div>;
  if (!quest) return <div className="min-h-screen flex items-center justify-center text-[#7c809a]">퀘스트를 찾을 수 없습니다</div>;

  const dDay = Math.ceil((new Date(quest.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const completedCount = missions.filter((m) => m.is_completed).length;

  return (
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-[#7c809a] hover:text-[#2e3347]">← 대시보드</button>
          <button onClick={deleteQuest} className="text-[#e07070] hover:text-red-500 text-sm">삭제</button>
        </div>

        {/* 퀘스트 정보 */}
        <div className="rounded-3xl p-6 text-white"
             style={{ background: "linear-gradient(145deg, #5b7fd6, #7b9ae8)", boxShadow: "0 8px 32px rgba(91,127,214,0.3), inset 0 1px 1px rgba(255,255,255,0.3)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{categoryEmoji[quest.category] ?? "⚡"}</span>
            <span className="text-lg font-bold">
              {dDay > 0 ? `D-${dDay}` : dDay === 0 ? "D-Day!" : `D+${Math.abs(dDay)}`}
            </span>
          </div>
          <h2 className="text-xl font-bold">{quest.title}</h2>
          <p className="text-sm opacity-70 mt-1">{quest.target_date} · {quest.category}</p>
        </div>

        {/* 오늘의 미션 */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#2e3347]">📋 오늘의 미션</h3>
            <span className="jelly-badge px-2 py-0.5 rounded-full text-xs text-[#7c809a]">{completedCount}/{missions.length}</span>
          </div>

          <div className="space-y-2 mb-4">
            {missions.map((mission) => (
              <div key={mission.id} className={`flex items-center gap-3 p-3 rounded-2xl ${
                mission.is_completed ? "bg-[#6dd4a8]/15" : "bg-white/25"
              }`} style={!mission.is_completed ? { boxShadow: "inset 0 1px 1px rgba(255,255,255,0.4)" } : {}}>
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs ${
                  mission.is_completed ? "bg-[#6dd4a8] border-[#6dd4a8] text-white" : "border-[#b0b3c4] bg-white/30"
                }`}>{mission.is_completed && "✓"}</span>
                <span className={`flex-1 text-sm ${mission.is_completed ? "line-through text-[#7c809a]" : "text-[#2e3347]"}`}>{mission.title}</span>
                <span className="text-xs font-bold text-[#f0c864]">+{mission.xp_reward}</span>
                {!mission.is_completed && (
                  <button onClick={() => deleteMission(mission.id)} className="text-[#b0b3c4] hover:text-[#e07070] text-sm">✕</button>
                )}
              </div>
            ))}
            {missions.length === 0 && <p className="text-center text-[#7c809a] py-4 text-sm">아직 미션이 없습니다</p>}
          </div>

          <form onSubmit={addMission} className="flex gap-2">
            <input type="text" value={newMission} onChange={(e) => setNewMission(e.target.value)}
              placeholder="미션 추가..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-white/30 border border-white/40 focus:outline-none focus:ring-2 focus:ring-[#5b7fd6]/50 text-sm text-[#2e3347] placeholder-[#7c809a]"
              style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)" }} />
            <button type="submit" className="px-4 py-2.5 text-white rounded-2xl text-sm font-medium jelly-btn">추가</button>
          </form>
        </div>
      </div>
    </div>
  );
}
