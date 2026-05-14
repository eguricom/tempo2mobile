import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { Clock, ArrowRight } from "lucide-react";

export default function MisJornadasPage() {
  const { sessionUserId, shifts } = useAppStore();

  const myShifts = useMemo(() =>
    shifts
      .filter((s) => s.userId === sessionUserId)
      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()),
    [shifts, sessionUserId],
  );

  const formatDuration = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const shiftDuration = (s: (typeof myShifts)[number]) => {
    const end = s.end ? new Date(s.end).getTime() : Date.now();
    let total = end - new Date(s.start).getTime();
    for (const p of s.pauses) {
      if (p.end) total -= new Date(p.end).getTime() - new Date(p.start).getTime();
      else total -= Date.now() - new Date(p.start).getTime();
    }
    return total;
  };

  const groupByDate = useMemo(() => {
    const groups: Record<string, (typeof myShifts)[number][]> = {};
    for (const s of myShifts) {
      const date = s.start.slice(0, 10);
      if (!groups[date]) groups[date] = [];
      groups[date].push(s);
    }
    return groups;
  }, [myShifts]);

  const dates = Object.keys(groupByDate);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b bg-background/80 px-4 py-3 backdrop-blur">
        <h1 className="text-base font-semibold">Mis jornadas</h1>
        <p className="text-xs text-muted-foreground">{myShifts.length} registros</p>
      </header>

      <main className="flex-1 overflow-y-auto">
        {dates.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">No tienes jornadas registradas.</p>
        )}

        {dates.map((date) => {
          const dayShifts = groupByDate[date];
          const dayTotal = dayShifts.reduce((acc, s) => acc + shiftDuration(s), 0);
          return (
            <div key={date} className="border-b">
              <div className="flex items-center justify-between bg-muted/30 px-4 py-2">
                <p className="text-xs font-semibold">
                  {new Date(date + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <p className="text-xs font-medium text-muted-foreground">{formatDuration(dayTotal)}</p>
              </div>
              {dayShifts.map((s) => {
                const startTime = new Date(s.start).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                const endTime = s.end
                  ? new Date(s.end).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                  : "—";
                return (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm">
                          {startTime} <ArrowRight className="inline h-3 w-3 text-muted-foreground" /> {endTime}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {s.status === "in_progress" ? "En curso" : s.status === "paused" ? "En pausa" : "Finalizada"}
                          {" · "}{formatDuration(shiftDuration(s))}
                          {s.pauses.length > 0 && ` · ${s.pauses.length} pausa(s)`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      s.status === "in_progress" ? "bg-success/10 text-success" :
                      s.status === "paused" ? "bg-warning/10 text-warning" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {s.status === "in_progress" ? "Activa" : s.status === "paused" ? "Pausa" : "Hecha"}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </main>
    </div>
  );
}
