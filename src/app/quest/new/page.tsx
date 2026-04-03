"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CATEGORIES = [
  { name: "공부", emoji: "📚" },
  { name: "운동", emoji: "💪" },
  { name: "재테크", emoji: "💰" },
  { name: "자기계발", emoji: "🌱" },
  { name: "기타", emoji: "⚡" },
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

    await supabase.from("quests").insert({
      user_id: user.id,
      title,
      target_date: targetDate,
      category,
    });

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-[#9CA3AF] hover:text-[#2D2D3F]">
            ← 뒤로
          </button>
          <h1 className="text-xl font-bold text-[#2D2D3F]">새 퀘스트 만들기</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2D3F] mb-2">퀘스트 이름</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 토익 900점 달성"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-[#FFF8F0] focus:outline-none focus:ring-2 focus:ring-[#7C5CFC] text-[#2D2D3F]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2D2D3F] mb-2">D-Day (목표 날짜)</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-[#FFF8F0] focus:outline-none focus:ring-2 focus:ring-[#7C5CFC] text-[#2D2D3F]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2D2D3F] mb-2">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      category === cat.name
                        ? "bg-[#7C5CFC] text-white shadow-sm"
                        : "bg-[#FFF8F0] text-[#2D2D3F] hover:bg-[#F5F0E8]"
                    }`}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !title || !targetDate}
            className="w-full py-3.5 bg-[#7C5CFC] text-white rounded-2xl font-medium hover:bg-[#6A4CE0] transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? "생성 중..." : "⚔️ 퀘스트 생성"}
          </button>
        </form>
      </div>
    </div>
  );
}
