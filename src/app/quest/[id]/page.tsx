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

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: questData } = await supabase
      .from("quests")
      .select("*")
      .eq("id", questId)
      .single();

    const { data: missionData } = await supabase
      .from("missions")
      .select("*")
      .eq("quest_id", questId)
      .eq("date", today)
      .order("created_at");

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
      quest_id: questId,
      user_id: user.id,
      title: newMission,
      date: today,
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  if (!quest) return <div className="min-h-screen flex items-center justify-center">퀘스트를 찾을 수 없습니다</div>;

  const dDay = Math.ceil((new Date(quest.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const completedCount = missions.filter((m) => m.is_completed).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push("/dashboard")} className="text-gray-500 hover:text-gray-700">
            ← 대시보드
          </button>
          <button onClick={deleteQuest} className="text-red-400 hover:text-red-600 text-sm">
            삭제
          </button>
        </div>

        {/* 퀘스트 정보 */}
        <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">{quest.category}</span>
            <span className="text-sm font-bold text-indigo-500">
              {dDay > 0 ? `D-${dDay}` : dDay === 0 ? "D-Day!" : `D+${Math.abs(dDay)}`}
            </span>
          </div>
          <h2 className="text-xl font-bold">{quest.title}</h2>
          <p className="text-sm text-gray-400 mt-1">{quest.target_date}</p>
        </div>

        {/* 오늘의 미션 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">오늘의 미션</h3>
            <span className="text-sm text-gray-400">{completedCount}/{missions.length} 완료</span>
          </div>

          {/* 미션 목록 */}
          <div className="space-y-2 mb-4">
            {missions.map((mission) => (
              <div key={mission.id} className="flex items-center gap-3 py-2">
                <span className={`flex-1 ${mission.is_completed ? "line-through text-gray-300" : ""}`}>
                  {mission.title}
                </span>
                <span className="text-xs text-gray-400">+{mission.xp_reward} XP</span>
                <button
                  onClick={() => deleteMission(mission.id)}
                  className="text-gray-300 hover:text-red-400 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
            {missions.length === 0 && (
              <p className="text-center text-gray-300 py-4">아직 미션이 없습니다</p>
            )}
          </div>

          {/* 미션 추가 */}
          <form onSubmit={addMission} className="flex gap-2">
            <input
              type="text"
              value={newMission}
              onChange={(e) => setNewMission(e.target.value)}
              placeholder="미션 추가..."
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600"
            >
              추가
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
