"use client";

import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  date: string;
}

const categoryEmoji: Record<string, string> = {
  "공부": "📚", "운동": "💪", "재테크": "💰", "자기계발": "🌱", "기타": "⚡",
};

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
    const { data: questData } = await supabase
      .from("quests").select("*").eq("id", questId).single();
    const { data: missionData } = await supabase
      .from("missions").select("*").eq("quest_id", questId).eq("date", today).order("created_at");
    setQuest(questData);
    setMissions(missionData ?? []);
    setLoading(false);
  }

  async function addMission(e: React.FormEvent) {
    e.preventDefault();
    if (!newMission.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("missions").insert({
      quest_id: questId, user_id: user.id, title: newMission, date: today,
    });
    setNewMission("");
    loadData();
  }

  async function deleteMission(missionId: string) {
    await supabase.from("missions").delete().eq("id", missionId);
    loadData();
  }

  async function deleteQuest() {
    if (!confirm("이 퀘스트를 삭제할까요?")) return;
    await supabase.from("quests").delete().eq("id", questId);
    router.push("/dashboard");
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0] text-[#9CA3AF]">로딩 중...</div>;
  if (!quest) return <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0] text-[#9CA3AF]">퀘스트를 찾을 수 없습니다</div>;

  const dDay = Math.ceil((new Date(quest.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const completedCount = missions.filter((m) => m.is_completed).length;

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-[#9CA3AF] hover:text-[#2D2D3F]">
            ← 대시보드
          </button>
          <button onClick={deleteQuest} className="text-[#FF6B9D] hover:text-red-500 text-sm">
            삭제
          </button>
        </div>

        {/* 퀘스트 정보 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{categoryEmoji[quest.category] ?? "⚡"}</span>
            <span className="text-lg font-bold text-[#7C5CFC]">
              {dDay > 0 ? `D-${dDay}` : dDay === 0 ? "D-Day!" : `D+${Math.abs(dDay)}`}
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#2D2D3F]">{quest.title}</h2>
          <p className="text-sm text-[#9CA3AF] mt-1">{quest.target_date} · {quest.category}</p>
        </div>

        {/* 오늘의 미션 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#2D2D3F]">📋 오늘의 미션</h3>
            <span className="text-sm text-[#9CA3AF]">{completedCount}/{missions.length}</span>
          </div>

          <div className="space-y-2 mb-4">
            {missions.map((mission) => (
              <div key={mission.id} className={`flex items-center gap-3 p-3 rounded-2xl ${
                mission.is_completed ? "bg-[#36D399]/10" : "bg-[#FFF8F0]"
              }`}>
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs ${
                  mission.is_completed ? "bg-[#36D399] border-[#36D399] text-white" : "border-[#9CA3AF]"
                }`}>
                  {mission.is_completed && "✓"}
                </span>
                <span className={`flex-1 text-sm ${mission.is_completed ? "line-through text-[#9CA3AF]" : "text-[#2D2D3F]"}`}>
                  {mission.title}
                </span>
                <span className="text-xs font-bold text-[#FBBD23]">+{mission.xp_reward} XP</span>
                {!mission.is_completed && (
                  <button onClick={() => deleteMission(mission.id)} className="text-[#9CA3AF] hover:text-[#FF6B9D] text-sm">
                    ✕
                  </button>
                )}
              </div>
            ))}
            {missions.length === 0 && (
              <p className="text-center text-[#9CA3AF] py-4 text-sm">아직 미션이 없습니다</p>
            )}
          </div>

          <form onSubmit={addMission} className="flex gap-2">
            <input
              type="text"
              value={newMission}
              onChange={(e) => setNewMission(e.target.value)}
              placeholder="미션 추가..."
              className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 bg-[#FFF8F0] focus:outline-none focus:ring-2 focus:ring-[#7C5CFC] text-sm text-[#2D2D3F]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#7C5CFC] text-white rounded-2xl text-sm font-medium hover:bg-[#6A4CE0]"
            >
              추가
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
