"use client";

export default function Bubbles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* 큰 버블 - 우상단 */}
      <div className="bubble bubble-1" style={{ width: '35vw', maxWidth: 300, height: '35vw', maxHeight: 300, top: '-8%', right: '-8%' }} />
      {/* 중간 버블 - 우측 */}
      <div className="bubble bubble-2" style={{ width: '22vw', maxWidth: 180, height: '22vw', maxHeight: 180, top: '18%', right: '5%' }} />
      {/* 작은 버블 - 좌측 */}
      <div className="bubble bubble-3" style={{ width: '18vw', maxWidth: 130, height: '18vw', maxHeight: 130, top: '45%', left: '-4%' }} />
      {/* 큰 버블 - 우하단 */}
      <div className="bubble bubble-4" style={{ width: '28vw', maxWidth: 220, height: '28vw', maxHeight: 220, bottom: '5%', right: '-6%' }} />
      {/* 작은 버블 - 좌하단 */}
      <div className="bubble bubble-5" style={{ width: '15vw', maxWidth: 100, height: '15vw', maxHeight: 100, bottom: '15%', left: '5%' }} />
      {/* 미니 버블 - 중앙 좌측 */}
      <div className="bubble bubble-1" style={{ width: '12vw', maxWidth: 80, height: '12vw', maxHeight: 80, top: '30%', left: '15%' }} />
    </div>
  );
}
