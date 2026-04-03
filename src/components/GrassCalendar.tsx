"use client";

interface ActivityDay { date: string; missions_completed: number; }
interface GrassCalendarProps { activities: ActivityDay[]; }

function getColor(count: number): string {
  if (count === 0) return "bg-[#f0f1f5]";
  if (count <= 2) return "bg-[#c7d2fe]";
  if (count <= 4) return "bg-[#818cf8]";
  return "bg-[#1b2559]";
}

export default function GrassCalendar({ activities }: GrassCalendarProps) {
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

  const weeks = Math.ceil(cells.length / 7);

  return (
    <div className="grid gap-[3px]" style={{
      gridTemplateColumns: `repeat(${weeks}, 1fr)`,
      gridTemplateRows: "repeat(7, 1fr)",
      gridAutoFlow: "column",
    }}>
      {cells.map((cell) => (
        <div
          key={cell.date}
          title={`${cell.date}: ${cell.count}개 완료`}
          className={`aspect-square rounded-[4px] transition-colors ${getColor(cell.count)}`}
        />
      ))}
    </div>
  );
}
