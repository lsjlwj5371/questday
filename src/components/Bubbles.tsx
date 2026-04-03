"use client";

export default function Bubbles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="bubble bubble-1" style={{ width: 280, height: 280, top: '-5%', right: '-3%' }} />
      <div className="bubble bubble-2" style={{ width: 180, height: 180, top: '15%', right: '10%' }} />
      <div className="bubble bubble-3" style={{ width: 120, height: 120, top: '40%', left: '-2%' }} />
      <div className="bubble bubble-4" style={{ width: 200, height: 200, bottom: '10%', right: '-5%' }} />
      <div className="bubble bubble-5" style={{ width: 90, height: 90, top: '60%', left: '8%' }} />
      <div className="bubble bubble-1" style={{ width: 150, height: 150, bottom: '-3%', left: '15%' }} />
      <div className="bubble bubble-3" style={{ width: 70, height: 70, top: '25%', left: '20%' }} />
    </div>
  );
}
