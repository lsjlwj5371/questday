"use client";

import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import gsap from "gsap";
// @ts-ignore - gsap Draggable casing issue on Windows
import { Draggable } from "gsap/dist/Draggable";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Draggable);
}

interface JellySqueezeProps {
  showControls?: boolean;
  className?: string;
  title?: string;
}

export function JellySqueeze({
  showControls = false,
  className,
  title = "꾹 눌러보세요!",
}: JellySqueezeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragTriggerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(0);

  const animState = useRef({
    totalFrames: 215,
    startFrame: 70,
    images: [] as HTMLImageElement[],
    currentFrame: -1,
    dragFrame: 70,
    displayFrame: 70,
    dragSensitivity: 5.2,
    smoothing: 0.11,
    startTime: 0,
    rafId: 0,
    isMounted: false,
  });

  useEffect(() => {
    animState.current.isMounted = true;
    const totalFrames = animState.current.totalFrames;
    let loaded = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 0; i < totalFrames; i++) {
      if (!animState.current.isMounted) return;
      const img = new Image();
      img.src = `https://cerpow.github.io/cerpow-img/jelly/jelly_${i.toString().padStart(5, "0")}.jpg`;
      img.onload = () => {
        loaded++;
        setImagesLoaded((prev) => prev + 1);
        if (loaded === totalFrames) setIsLoading(false);
      };
      img.onerror = () => {
        loaded++;
        setImagesLoaded((prev) => prev + 1);
        if (loaded === totalFrames) setIsLoading(false);
      };
      images[i] = img;
    }
    animState.current.images = images;

    return () => {
      animState.current.isMounted = false;
      cancelAnimationFrame(animState.current.rafId);
    };
  }, []);

  useLayoutEffect(() => {
    if (isLoading || !canvasRef.current || !dragTriggerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const state = animState.current;

    gsap.set(canvas, { y: state.startFrame / state.dragSensitivity });

    const resetWithinBounds = (frame: number) =>
      Math.max(0, Math.min(state.totalFrames - 1, Math.floor(frame)));

    const setCanvasSize = () => {
      if (!canvas) return;
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = width * (3 / 4);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.height = `${height}px`;
      if (ctx) {
        ctx.scale(ratio, ratio);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "medium";
      }
      state.currentFrame = -1;
    };

    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    const draggable = Draggable.create(canvas, {
      trigger: dragTriggerRef.current,
      type: "y",
      inertia: true,
      bounds: { minY: 0, maxY: (state.totalFrames - 1) / state.dragSensitivity },
      allowNativeTouchScrolling: false,
      dragResistance: 0.5,
      edgeResistance: 1,
      minDuration: 0.4,
      onDrag: function () { state.dragFrame = this.y * state.dragSensitivity; },
      onThrowUpdate: function () { state.dragFrame = this.y * state.dragSensitivity; },
    })[0];

    state.startTime = Date.now();
    const animate = () => {
      if (!state.isMounted) return;
      const now = Date.now();
      const dt = (now - state.startTime) / 1000;
      state.startTime = now;
      const dampening = 1.0 - Math.exp(-state.smoothing * 60 * dt);
      state.displayFrame += (state.dragFrame - state.displayFrame) * dampening;
      const newFrame = resetWithinBounds(state.displayFrame);
      if (newFrame !== state.currentFrame && state.images[newFrame]?.complete && ctx) {
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        ctx.drawImage(state.images[newFrame], 0, 0, canvas.clientWidth, canvas.clientHeight);
        state.currentFrame = newFrame;
      }
      state.rafId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      cancelAnimationFrame(state.rafId);
      draggable.kill();
    };
  }, [isLoading]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-col items-center justify-center w-full overflow-hidden select-none",
        className
      )}
    >
      <div className="relative w-full max-w-[400px] min-w-[280px] aspect-[4/3] z-10">
        <canvas
          ref={canvasRef}
          className={cn(
            "w-full h-full rounded-3xl transition-opacity duration-1000 ease-out",
            isLoading ? "opacity-0 scale-90" : "opacity-100 scale-100"
          )}
        />
        <div
          ref={dragTriggerRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[49%] w-[56%] h-[52%] rounded-full cursor-grab active:cursor-grabbing z-20"
          aria-label="Drag to squeeze"
        />
      </div>

      {/* 로딩 바 */}
      <div
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[150px] h-[2px] bg-white/20 transition-all duration-500",
          !isLoading && "opacity-0 invisible"
        )}
      >
        <div className="h-full bg-primary animate-loader w-1/4" />
      </div>

      {/* 타이틀 */}
      <p
        className={cn(
          "mt-3 text-sm text-text-light transition-opacity duration-700",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      >
        {title}
      </p>

      <style>{`
        @keyframes loader {
          0% { opacity: 0; transform: translateX(0%); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translateX(300%); }
        }
        .animate-loader {
          animation: loader 1.3s infinite alternate ease-in-out;
        }
      `}</style>
    </div>
  );
}
