import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { GpsTracker } from "@/components/GpsTracker";
import { toast } from "sonner";
import { Play, Pause, Square } from "lucide-react";

const DAY_TARGET_SECONDS = 8 * 3600;
const RING_RADIUS = 110;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function HomePage() {
  const { sessionUserId, users, shifts, startShift, pauseShift, resumeShift, endShift } = useAppStore();
  const user = users.find((u) => u.id === sessionUserId);
  const activeShift = shifts.find((s) => s.userId === sessionUserId && (s.status === "in_progress" || s.status === "paused"));

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const todayShifts = useMemo(() =>
    shifts.filter((s) => s.userId === sessionUserId && s.start.startsWith(new Date().toISOString().slice(0, 10))),
    [shifts, sessionUserId],
  );

  const todayTotalMs = useMemo(() => {
    let total = 0;
    for (const s of todayShifts) {
      if (s.status === "finished" && s.end) {
        total += new Date(s.end).getTime() - new Date(s.start).getTime();
      } else if (s.status === "in_progress" || s.status === "paused") {
        total += now - new Date(s.start).getTime();
      }
      for (const p of s.pauses) {
        if (p.end) total -= new Date(p.end).getTime() - new Date(p.start).getTime();
        else total -= now - new Date(p.start).getTime();
      }
    }
    return Math.max(0, total);
  }, [todayShifts, now]);

  const totalSec = Math.floor(todayTotalMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const progress = Math.min(totalSec / DAY_TARGET_SECONDS, 1);
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  const recordGpsPoint = (): { lat?: number; lng?: number } => {
    return {};
  };

  const handleStart = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => { startShift(sessionUserId!, pos.coords.latitude, pos.coords.longitude); toast.success("Jornada iniciada"); },
      () => { startShift(sessionUserId!); toast.success("Jornada iniciada (sin GPS)"); },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  };

  const handlePause = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => { pauseShift(sessionUserId!, pos.coords.latitude, pos.coords.longitude); toast.success("Pausa iniciada"); },
      () => { pauseShift(sessionUserId!); toast.success("Pausa iniciada"); },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  };

  const handleResume = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => { resumeShift(sessionUserId!, pos.coords.latitude, pos.coords.longitude); toast.success("Jornada reanudada"); },
      () => { resumeShift(sessionUserId!); toast.success("Jornada reanudada"); },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  };

  const handleEnd = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => { endShift(sessionUserId!, pos.coords.latitude, pos.coords.longitude); toast.success("Jornada finalizada"); },
      () => { endShift(sessionUserId!); toast.success("Jornada finalizada"); },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <GpsTracker />

      {/* Header */}
      <header className="flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
            TM
          </div>
          <div>
            <p className="text-sm font-semibold">Tempo Mobile</p>
            <p className="text-[10px] text-muted-foreground">{user?.name} {user?.lastName}</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {/* Date */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>

        {/* Activity ring with timer */}
        <div className="relative flex items-center justify-center">
          <svg width="260" height="260" className="-rotate-90">
            <circle cx="130" cy="130" r={RING_RADIUS} fill="none" className="stroke-muted/30" strokeWidth="14" />
            <circle
              cx="130" cy="130" r={RING_RADIUS}
              fill="none"
              className="stroke-primary transition-all duration-700 ease-out"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-bold tabular-nums tracking-tight">{timeStr}</span>
            <span className="text-xs text-muted-foreground mt-1">Total hoy</span>
          </div>
        </div>

        {/* Progress text */}
        <p className="text-xs text-muted-foreground">
          {Math.round(progress * 100)}% de la jornada ({Math.round((DAY_TARGET_SECONDS - totalSec) / 60)} min restantes)
        </p>

        {/* Big buttons */}
        <div className="w-full max-w-xs space-y-3">
          {!activeShift && (
            <button onClick={handleStart} className="w-full rounded-xl bg-success py-5 text-lg font-semibold text-success-foreground shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3">
              <Play className="h-6 w-6" /> Comenzar jornada
            </button>
          )}

          {activeShift?.status === "in_progress" && (
            <>
              <button onClick={handlePause} className="w-full rounded-xl bg-accent py-5 text-lg font-semibold text-accent-foreground shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3">
                <Pause className="h-6 w-6" /> Pausar
              </button>
              <button onClick={handleEnd} className="w-full rounded-xl bg-destructive py-5 text-lg font-semibold text-destructive-foreground shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3">
                <Square className="h-6 w-6" /> Terminar jornada
              </button>
            </>
          )}

          {activeShift?.status === "paused" && (
            <>
              <button onClick={handleResume} className="w-full rounded-xl bg-success py-5 text-lg font-semibold text-success-foreground shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3">
                <Play className="h-6 w-6" /> Reanudar
              </button>
              <button onClick={handleEnd} className="w-full rounded-xl bg-destructive py-5 text-lg font-semibold text-destructive-foreground shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3">
                <Square className="h-6 w-6" /> Terminar jornada
              </button>
            </>
          )}
        </div>

        {/* Status indicator */}
        {activeShift && (
          <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5">
            <span className={`h-2 w-2 rounded-full ${activeShift.status === "in_progress" ? "bg-success animate-pulse" : "bg-warning"}`} />
            <span className="text-xs font-medium">{activeShift.status === "in_progress" ? "Trabajando" : "En pausa"}</span>
          </div>
        )}
      </main>
    </div>
  );
}
