"use client";

import { createClient } from "@/lib/supabase/client";
import Bubbles from "@/components/Bubbles";

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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative">
      <Bubbles />

      <div className="w-full max-w-sm text-center relative z-10">
        <div className="animate-in">
          <div className="mb-10">
            <div className="w-14 h-14 rounded-full bg-[#1b2559] flex items-center justify-center mx-auto mb-5">
              <span className="text-white text-xl">⚔️</span>
            </div>
            <h1 className="text-4xl font-bold text-[#1a1d2e] leading-tight mb-3">
              여기까지 온 거,<br />이미 절반은 하신 거예요
            </h1>
            <p className="text-[#6b7094] text-base leading-relaxed">
              목표를 세우고, 매일 미션을 클리어하세요.<br />
              30일이면 습관이 됩니다.
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="btn-gradient-border w-full text-base"
          >
            Google로 바로 시작하기 →
          </button>

          <p className="text-[#6b7094] text-sm mt-5">
            지금 시작하면 오늘이 Day 1
          </p>
        </div>
      </div>
    </div>
  );
}
