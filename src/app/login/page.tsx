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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-6 text-center">
        <h1 className="text-3xl font-bold mb-2">QuestDay</h1>
        <p className="text-gray-500 mb-8">목표를 퀘스트로, 매일을 레벨업으로</p>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 px-4 bg-indigo-500 text-white rounded-2xl font-medium hover:bg-indigo-600 transition-colors"
        >
          Google로 시작하기
        </button>
      </div>
    </div>
  );
}
