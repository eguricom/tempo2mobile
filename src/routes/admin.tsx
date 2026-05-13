import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { Link } from "@tanstack/react-router";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { ArrowLeft, Clock, MapPin } from "lucide-react";

// Fix default marker icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png", iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png" });

export default function AdminPage() {
  const { users, shifts, devMode } = useAppStore();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const gpsUsers = users.filter((u) => u.gpsEnabled);
  const selectedUser = users.find((u) => u.id === selectedUserId);

  const activeWorkers = useMemo(() => {
    const now = new Date().toISOString().slice(0, 10);
    return users.filter((u) =>
      shifts.some((s) => s.userId === u.id && (s.status === "in_progress" || s.status === "paused") && s.start.startsWith(now)),
    );
  }, [users, shifts]);

  const userGpsPoints = useMemo(() => {
    if (!selectedUserId) return [];
    return shifts
      .filter((s) => s.userId === selectedUserId)
      .flatMap((s) => s.gpsPoints)
      .sort((a, b) => a.ts.localeCompare(b.ts));
  }, [selectedUserId, shifts]);

  const center: [number, number] = userGpsPoints.length > 0
    ? [userGpsPoints[userGpsPoints.length - 1].lat, userGpsPoints[userGpsPoints.length - 1].lng]
    : [43.362, -8.411]; // Default to A Coruña

  if (!devMode) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Solo disponible en modo desarrollador.</p>
        <Link to="/" className="mt-4 text-sm text-primary underline">Volver</Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Link to="/" className="rounded-md p-1 hover:bg-accent"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-base font-semibold">Panel de control</h1>
          <p className="text-xs text-muted-foreground">{activeWorkers.length} trabajando ahora</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Active workers strip */}
        <div className="flex gap-2 overflow-x-auto p-3 border-b">
          {gpsUsers.map((u) => {
            const isActive = activeWorkers.some((w) => w.id === u.id);
            return (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`flex-shrink-0 rounded-lg px-3 py-2 text-xs text-left transition-colors ${selectedUserId === u.id ? "bg-primary text-primary-foreground" : isActive ? "bg-accent" : "bg-muted"}`}
              >
                <p className="font-medium">{u.name.split(" ")[0]}</p>
                <p className="opacity-70">{isActive ? "🟢 Activo" : "⚪ Inactivo"}</p>
              </button>
            );
          })}
        </div>

        {selectedUser && (
          <>
            {/* User info */}
            <div className="px-3 py-2 border-b bg-muted/30">
              <p className="text-sm font-medium">{selectedUser.name} {selectedUser.lastName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {userGpsPoints.length} puntos registrados
              </p>
            </div>

            {/* Map */}
            <div className="flex-1 min-h-[300px]">
              <MapContainer center={center} zoom={15} className="h-full w-full" key={selectedUserId}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {userGpsPoints.length > 0 && (
                  <>
                    <Polyline positions={userGpsPoints.map((p) => [p.lat, p.lng] as [number, number])} color="#6366f1" />
                    <Marker position={[userGpsPoints[userGpsPoints.length - 1].lat, userGpsPoints[userGpsPoints.length - 1].lng]}>
                      <Popup>
                        <div className="text-xs">
                          <p className="font-medium">{selectedUser.name}</p>
                          <p className="text-muted-foreground">{new Date(userGpsPoints[userGpsPoints.length - 1].ts).toLocaleString("es-ES")}</p>
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}
              </MapContainer>
            </div>

            {/* Today's shifts */}
            <div className="border-t bg-background">
              <div className="px-3 py-2 border-b">
                <p className="text-xs font-semibold flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Jornadas de hoy
                </p>
              </div>
              <div className="max-h-40 overflow-y-auto divide-y">
                {shifts
                  .filter((s) => s.userId === selectedUserId && s.start.startsWith(new Date().toISOString().slice(0, 10)))
                  .map((s) => (
                    <div key={s.id} className="px-3 py-2 text-xs">
                      <div className="flex justify-between">
                        <span className={s.status === "in_progress" ? "text-success font-medium" : s.status === "paused" ? "text-warning" : ""}>
                          {s.status === "in_progress" ? "Trabajando" : s.status === "paused" ? "En pausa" : "Finalizada"}
                        </span>
                        <span className="text-muted-foreground">{new Date(s.start).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      {s.gpsPoints.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{s.gpsPoints.length} puntos GPS</p>
                      )}
                    </div>
                  ))}
                {shifts.filter((s) => s.userId === selectedUserId && s.start.startsWith(new Date().toISOString().slice(0, 10))).length === 0 && (
                  <p className="px-3 py-4 text-xs text-center text-muted-foreground">Sin jornadas hoy</p>
                )}
              </div>
            </div>
          </>
        )}

        {!selectedUser && (
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">Selecciona un usuario para ver su seguimiento</p>
          </div>
        )}
      </main>
    </div>
  );
}
