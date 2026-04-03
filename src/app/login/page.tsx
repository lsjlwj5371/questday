"use client";

import { createClient } from "@/lib/supabase/client";

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
        <div className="glass rounded-3xl p-10 mb-6">
          <h1 className="text-4xl font-bold text-[#2e3347] mb-2">⚔️</h1>
          <h2 className="text-2xl font-bold text-[#2e3347] mb-1">QuestDay</h2>
          <p className="text-[#7c809a] text-sm mb-8">목표를 퀘스트로, 매일을 레벨업으로</p>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-3.5 px-4 text-white rounded-2xl font-medium jelly-btn"
          >
            Google로 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
