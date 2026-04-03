"use client";

interface ActivityDay {
  date: string;
  missions_completed: number;
}

interface GrassCalendarProps {
  activities: ActivityDay[];
}

function getColor(count: number): string {
  if (count === 0) return "bg-gray-100";
  if (count <= 2) return "bg-green-200";
  if (count <= 4) return "bg-green-400";
  return "bg-green-500";
}

export default function GrassCalendar({ activities }: GrassCalendarProps) {
  // 최근 90일 기준
  const days = 90;
  const today = new Date();
  const cells: { date: string; count: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const activity = activities.find((a) => a.date === dateStr);
    cells.push({ date: dateStr, count: activity?.missions_completed ?? 0 });
  }

  // 7행 (요일) x N열로 배치
  const weeks = Math.ceil(cells.length / 7);

  return (
    <div>
      <div className="grid gap-[3px]" style={{
        gridTemplateColumns: `repeat(${weeks}, 1fr)`,
        gridTemplateRows: "repeat(7, 1fr)",
        gridAutoFlow: "column",
      }}>
        {cells.map((cell) => (
          <div
            key={cell.date}
            title={`${cell.date}: ${cell.count}개 완료`}
            className={`aspect-square rounded-[3px] ${getColor(cell.count)}`}
          />
        ))}
      </div>
    </div>
  );
}
