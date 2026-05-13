import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { GpsTracker } from "@/components/GpsTracker";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Play, Pause, Square, Settings, Map, LogOut } from "lucide-react";

export default function HomePage() {
  const { sessionUserId, users, shifts, startShift, pauseShift, resumeShift, endShift, devMode, logout } = useAppStore();
  const user = users.find((u) => u.id === sessionUserId);
  const activeShift = shifts.find((s) => s.userId === sessionUserId && (s.status === "in_progress" || s.status === "paused"));

  const todayShifts = useMemo(() =>
    shifts.filter((s) => s.userId === sessionUserId && s.start.startsWith(new Date().toISOString().slice(0, 10))),
    [shifts, sessionUserId],
  );

  const todayTotal = useMemo(() => {
    let total = 0;
    for (const s of todayShifts) {
      if (s.status === "finished" && s.end) {
        total += new Date(s.end).getTime() - new Date(s.start).getTime();
      } else if (s.status === "in_progress" || s.status === "paused") {
        total += Date.now() - new Date(s.start).getTime();
      }
      for (const p of s.pauses) {
        if (p.end) total -= new Date(p.end).getTime() - new Date(p.start).getTime();
        else total -= Date.now() - new Date(p.start).getTime();
      }
    }
    return Math.floor(total / 60000);
  }, [todayShifts]);

  const recordGpsPoint = (): { lat?: number; lng?: number } => {
    // Try to get GPS position synchronously from cache
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
    <div className="flex min-h-dvh flex-col bg-background">
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
        <div className="flex items-center gap-1">
          {devMode && (
            <Link to="/admin" className="rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent">
              <Map className="h-4 w-4" />
            </Link>
          )}
          {user?.role === "admin" && (
            <Link to="/usuarios" className="rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent">
              <Settings className="h-4 w-4" />
            </Link>
          )}
          <button onClick={() => { logout(); toast.success("Sesión cerrada"); }} className="rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {/* User info */}
        <div className="text-center">
          <h2 className="text-lg font-semibold">{user?.name} {user?.lastName}</h2>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>

        {/* Today's hours */}
        <div className="text-center">
          <p className="text-5xl font-bold tabular-nums">{Math.floor(todayTotal / 60)}h {todayTotal % 60}m</p>
          <p className="text-xs text-muted-foreground mt-1">Total hoy</p>
        </div>

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
