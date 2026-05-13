import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { apiPost } from "@/lib/api";

export function GpsTracker() {
  const sessionUserId = useAppStore((s) => s.sessionUserId);
  const users = useAppStore((s) => s.users);
  const shifts = useAppStore((s) => s.shifts);
  const addGpsPoint = useAppStore((s) => s.addGpsPoint);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef = useRef<number | null>(null);
  const lastPoint = useRef<{ lat: number; lng: number } | null>(null);

  const user = users.find((u) => u.id === sessionUserId);
  const needsGps = user?.gpsEnabled;
  const activeShift = shifts.find((s) => s.userId === sessionUserId && (s.status === "in_progress" || s.status === "paused"));

  useEffect(() => {
    if (!needsGps || !sessionUserId || !activeShift) {
      if (watchRef.current) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }

    const record = (lat: number, lng: number) => {
      lastPoint.current = { lat, lng };
      addGpsPoint(sessionUserId, lat, lng);
      apiPost("/api/gps.php", { userId: sessionUserId, lat, lng, ts: new Date().toISOString(), shiftId: activeShift.id });
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => record(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );

    // Continuous watch
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => record(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );

    // Periodic ping every 5 minutes
    intervalRef.current = setInterval(() => {
      if (lastPoint.current) {
        addGpsPoint(sessionUserId, lastPoint.current.lat, lastPoint.current.lng);
        apiPost("/api/gps.php", {
          userId: sessionUserId,
          lat: lastPoint.current.lat,
          lng: lastPoint.current.lng,
          ts: new Date().toISOString(),
          shiftId: activeShift.id,
        });
      }
    }, 300000); // 5 min

    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [needsGps, sessionUserId, activeShift?.id, activeShift?.status]);

  return null;
}
