"use client";

import { createClient } from "@/lib/supabase/client";
import { JellySqueeze } from "@/components/JellySqueeze";

export default function LoginPage() {
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF8F0] px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-[#2D2D3F] mb-1">QuestDay</h1>
        <p className="text-[#9CA3AF] text-sm mb-6">목표를 퀘스트로, 매일을 레벨업으로</p>

        <JellySqueeze title="꾹 눌러보세요!" className="mb-6" />

        <p className="text-[#2D2D3F] font-medium mb-6">목표를 꾹 눌러 달성하세요</p>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3.5 px-4 bg-[#7C5CFC] text-white rounded-2xl font-medium hover:bg-[#6A4CE0] transition-colors shadow-sm"
        >
          Google로 시작하기
        </button>
      </div>
    </div>
  );
}
