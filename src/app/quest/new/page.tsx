"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CATEGORIES = ["공부", "운동", "재테크", "자기계발", "기타"];

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            ← 뒤로
          </button>
          <h1 className="text-xl font-bold">새 퀘스트 만들기</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">퀘스트 이름</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 토익 900점 달성"
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">D-Day (목표 날짜)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    category === cat
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !title || !targetDate}
            className="w-full py-3 bg-indigo-500 text-white rounded-2xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
          >
            {loading ? "생성 중..." : "퀘스트 생성"}
          </button>
        </form>
      </div>
    </div>
  );
}
