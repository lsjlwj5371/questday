"use client";

import { createClient } from "@/lib/supabase/client";
import Bubbles from "@/components/Bubbles";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetDate) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("quests").insert({ user_id: user.id, title, target_date: targetDate, category });
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen relative">
      <Bubbles />
      <div className="max-w-lg mx-auto px-4 py-6 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-[#6b7094] hover:text-[#1a1d2e]">← 뒤로</button>
          <h1 className="text-xl font-bold text-[#1a1d2e]">새 퀘스트 만들기</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-6 space-y-5 animate-in">
            <div>
              <label className="block text-sm font-semibold text-[#1a1d2e] mb-2">퀘스트 이름</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 토익 900점 달성"
                className="w-full px-4 py-3.5 rounded-2xl bg-[#f7f8fa] border border-[#e2e4ed] focus:outline-none focus:ring-2 focus:ring-[#1b2559]/20 focus:border-[#1b2559] text-[#1a1d2e] placeholder-[#6b7094] transition-all"
                required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1a1d2e] mb-2">D-Day (목표 날짜)</label>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-[#f7f8fa] border border-[#e2e4ed] focus:outline-none focus:ring-2 focus:ring-[#1b2559]/20 focus:border-[#1b2559] text-[#1a1d2e] transition-all"
                required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1a1d2e] mb-2">카테고리</label>
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

          <button type="submit" disabled={loading || !title || !targetDate}
            className="w-full btn-primary py-4 text-base disabled:opacity-50 animate-in animate-in-delay-1">
            {loading ? "생성 중..." : "⚔️ 퀘스트 생성"}
          </button>
        </form>
      </div>
    </div>
  );
}
