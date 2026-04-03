"use client";

import { createClient } from "@/lib/supabase/client";
import { generateAllMissions } from "@/lib/mission-recommend";
import Bubbles from "@/components/Bubbles";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CATEGORIES = [
  { name: "공부", emoji: "📚" }, { name: "운동", emoji: "💪" },
  { name: "재테크", emoji: "💰" }, { name: "자기계발", emoji: "🌱" }, { name: "기타", emoji: "⚡" },
];

export default function NewQuestPage() {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [category, setCategory] = useState("공부");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  // 남은 일수 계산
  const daysLeft = targetDate
    ? Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetDate) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. 퀘스트 생성
    setProgress("퀘스트 생성 중...");
    const { data: quest } = await supabase
      .from("quests")
      .insert({ user_id: user.id, title, target_date: targetDate, category })
      .select()
      .single();

    if (!quest) { setLoading(false); return; }

    // 2. 목표일까지 매일 미션 자동 생성
    setProgress("미션 자동 생성 중...");
    const allDays = generateAllMissions(title, category, targetDate);

    // Supabase에 한번에 insert (배치)
    const allMissions = allDays.flatMap(({ date, missions }) =>
      missions.map((missionTitle) => ({
        quest_id: quest.id,
        user_id: user.id,
        title: missionTitle,
        date,
      }))
    );

    // 500개씩 배치 insert (Supabase 제한 대응)
    for (let i = 0; i < allMissions.length; i += 500) {
      const batch = allMissions.slice(i, i + 500);
      await supabase.from("missions").insert(batch);
      setProgress(`미션 생성 중... ${Math.min(i + 500, allMissions.length)}/${allMissions.length}`);
    }

    setProgress("완료!");
    router.push(`/quest/${quest.id}`);
  };

  return (
    <div className="min-h-screen relative">
      <Bubbles />
      <Navbar />
      <div className="max-w-lg mx-auto px-6 py-8 relative z-10">
        <h1 className="text-3xl font-bold text-[#1a1d2e] mb-2 animate-in">새 퀘스트 만들기</h1>
        <p className="text-[#6b7094] mb-8 animate-in">목표와 기간을 정하면, 매일의 미션을 자동으로 만들어드려요</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-6 space-y-5 animate-in animate-in-delay-1">
            <div>
              <label className="block text-sm font-semibold text-[#1a1d2e] mb-2">퀘스트 이름</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 토익 900점 달성"
                className="w-full px-4 py-3.5 rounded-2xl bg-[#f7f8fa] border border-[#e2e4ed] focus:outline-none focus:ring-2 focus:ring-[#1b2559]/20 focus:border-[#1b2559] text-[#1a1d2e] placeholder-[#b0b3c4] transition-all"
                required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1a1d2e] mb-2">D-Day (목표 날짜)</label>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-[#f7f8fa] border border-[#e2e4ed] focus:outline-none focus:ring-2 focus:ring-[#1b2559]/20 focus:border-[#1b2559] text-[#1a1d2e] transition-all"
                required />
              {daysLeft > 0 && (
                <p className="text-sm text-[#6b7094] mt-2">
                  D-{daysLeft} · {daysLeft}일 동안 매일 미션이 자동 생성됩니다
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1a1d2e] mb-3">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat.name} type="button" onClick={() => setCategory(cat.name)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      category === cat.name
                        ? "bg-[#1b2559] text-white"
                        : "bg-[#f7f8fa] text-[#1a1d2e] border border-[#e2e4ed] hover:bg-[#eef0f5]"
                    }`}>
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 미리보기: 오늘 생성될 미션 */}
          {title && targetDate && daysLeft > 0 && (
            <div className="card p-6 animate-in animate-in-delay-2">
              <h3 className="font-semibold text-[#1a1d2e] mb-1 text-sm">오늘 생성될 미션 미리보기</h3>
              <p className="text-xs text-[#6b7094] mb-3">매일 다른 조합의 미션이 자동 배정됩니다</p>
              <div className="space-y-2">
                {generateAllMissions(title, category, targetDate)[0]?.missions.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-[#f7f8fa]">
                    <span className="w-5 h-5 rounded-md border-2 border-[#d1d5e0] flex-shrink-0" />
                    <span className="text-sm text-[#1a1d2e]">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={loading || !title || !targetDate || daysLeft <= 0}
            className="w-full btn-primary py-4 text-base disabled:opacity-50 animate-in animate-in-delay-3">
            {loading ? progress : `퀘스트 생성 → ${daysLeft > 0 ? `(${daysLeft}일치 미션 자동 생성)` : ""}`}
          </button>
        </form>
      </div>
    </div>
  );
}
