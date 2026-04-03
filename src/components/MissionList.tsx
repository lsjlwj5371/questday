"use client";

import { createClient } from "@/lib/supabase/client";
import { calculateMissionXP, awardXP, calculateLevel } from "@/lib/xp";
import { useState } from "react";

interface Mission {
  id: string;
  title: string;
  xp_reward: number;
  is_completed: boolean;
  quest_id: string;
}

interface MissionListProps {
  missions: Mission[];
  currentStreak: number;
  todayXP: number;
  onUpdate: () => void;
}

export default function MissionList({ missions, currentStreak, todayXP, onUpdate }: MissionListProps) {
  const supabase = createClient();
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  async function toggleMission(mission: Mission) {
    if (mission.is_completed) return; // 완료 취소는 지원하지 않음

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // XP 계산
    const earnedXP = calculateMissionXP(currentStreak);
    const actualXP = awardXP(todayXP, earnedXP);

    // 미션 완료 처리
    await supabase
      .from("missions")
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq("id", mission.id);

    // activity_log upsert
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("activity_log")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (existing) {
      await supabase
        .from("activity_log")
        .update({
          missions_completed: existing.missions_completed + 1,
          xp_earned: existing.xp_earned + actualXP,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("activity_log").insert({
        user_id: user.id,
        date: today,
        missions_completed: 1,
        xp_earned: actualXP,
      });
    }

    // users 테이블 XP/레벨 업데이트
    const { data: profile } = await supabase
      .from("users")
      .select("total_xp")
      .eq("id", user.id)
      .single();

    const newTotalXP = (profile?.total_xp ?? 0) + actualXP;
    const newLevel = calculateLevel(newTotalXP);

    await supabase
      .from("users")
      .update({ total_xp: newTotalXP, level: newLevel })
      .eq("id", user.id);

    // 애니메이션
    setAnimatingId(mission.id);
    setTimeout(() => setAnimatingId(null), 600);

    onUpdate();
  }

  return (
    <div className="space-y-2">
      {missions.map((mission) => (
        <button
          key={mission.id}
          onClick={() => toggleMission(mission)}
          disabled={mission.is_completed}
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
            mission.is_completed
              ? "bg-green-50 text-gray-400"
              : "bg-gray-50 hover:bg-gray-100"
          } ${animatingId === mission.id ? "scale-95" : ""}`}
        >
          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            mission.is_completed
              ? "bg-green-400 border-green-400 text-white"
              : "border-gray-300"
          }`}>
            {mission.is_completed && "✓"}
          </span>
          <span className={`flex-1 text-sm ${mission.is_completed ? "line-through" : ""}`}>
            {mission.title}
          </span>
          <span className="text-xs text-gray-400">+{mission.xp_reward} XP</span>
        </button>
      ))}
    </div>
  );
}
