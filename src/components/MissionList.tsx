"use client";

import { createClient } from "@/lib/supabase/client";
import { calculateMissionXP, awardXP, calculateLevel } from "@/lib/xp";
import { useState } from "react";

interface Mission { id: string; title: string; xp_reward: number; is_completed: boolean; quest_id: string; }
interface MissionListProps { missions: Mission[]; currentStreak: number; todayXP: number; onUpdate: () => void; }

export default function MissionList({ missions, currentStreak, todayXP, onUpdate }: MissionListProps) {
  const supabase = createClient();
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  async function toggleMission(mission: Mission) {
    if (mission.is_completed) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const earnedXP = calculateMissionXP(currentStreak);
    const actualXP = awardXP(todayXP, earnedXP);
    await supabase.from("missions").update({ is_completed: true, completed_at: new Date().toISOString() }).eq("id", mission.id);
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase.from("activity_log").select("*").eq("user_id", user.id).eq("date", today).single();
    if (existing) {
      await supabase.from("activity_log").update({ missions_completed: existing.missions_completed + 1, xp_earned: existing.xp_earned + actualXP }).eq("id", existing.id);
    } else {
      await supabase.from("activity_log").insert({ user_id: user.id, date: today, missions_completed: 1, xp_earned: actualXP });
    }
    const { data: profile } = await supabase.from("users").select("total_xp").eq("id", user.id).single();
    const newTotalXP = (profile?.total_xp ?? 0) + actualXP;
    await supabase.from("users").update({ total_xp: newTotalXP, level: calculateLevel(newTotalXP) }).eq("id", user.id);
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
          className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all text-left border ${
            mission.is_completed
              ? "bg-[#f0fdf4] border-[#d1fae5]"
              : "bg-[#f7f8fa] border-transparent hover:bg-[#eef0f5]"
          } ${animatingId === mission.id ? "scale-95" : ""}`}
        >
          <span className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 text-xs transition-all ${
            mission.is_completed
              ? "bg-[#1b2559] border-[#1b2559] text-white"
              : "border-[#d1d5e0]"
          }`}>
            {mission.is_completed && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </span>
          <span className={`flex-1 text-sm ${mission.is_completed ? "line-through text-[#6b7094]" : "text-[#1a1d2e]"}`}>
            {mission.title}
          </span>
          <span className="text-xs font-semibold text-[#1b2559]">+{mission.xp_reward} XP</span>
        </button>
      ))}
    </div>
  );
}
