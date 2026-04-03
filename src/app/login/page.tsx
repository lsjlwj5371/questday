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
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        {/* 로고 */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-[#2e3347]">QuestDay</h1>
          <p className="text-[#7c809a] text-sm mt-1">목표를 퀘스트로, 매일을 레벨업으로</p>
        </div>

        {/* 젤리 마스코트 */}
        <div className="glass rounded-3xl p-2 mb-6">
          <JellySqueeze title="꾹 눌러보세요!" />
        </div>

        {/* 슬로건 */}
        <p className="text-[#2e3347] font-medium mb-5 text-sm">목표를 꾹 눌러 달성하세요</p>

        {/* 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          className="w-full py-3.5 px-4 text-white rounded-2xl font-medium jelly-btn"
        >
          Google로 시작하기
        </button>
      </div>
    </div>
  );
}
