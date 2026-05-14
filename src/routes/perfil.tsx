import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { User, Mail, Fingerprint, Shield, LogOut, Sparkles, Lock, Unlock } from "lucide-react";

export default function PerfilPage() {
  const { sessionUserId, users, logout, devMode } = useAppStore();
  const user = users.find((u) => u.id === sessionUserId);
  const [showDevDialog, setShowDevDialog] = useState(false);
  if (!user) return null;

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada");
  };

  const info = [
    { icon: User, label: "Nombre", value: `${user.name} ${user.lastName}` },
    { icon: Mail, label: "Email", value: user.email },
    { icon: Fingerprint, label: "NIF", value: user.nif },
    { icon: Shield, label: "Rol", value: user.role === "admin" ? "Administrador" : "Motorista" },
  ];

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b bg-background/80 px-4 py-3 backdrop-blur">
        <h1 className="text-base font-semibold">Mi perfil</h1>
      </header>

      <main className="flex-1 p-4 space-y-4">
        <div className="flex flex-col items-center py-6">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
            style={{ backgroundColor: user.avatarColor || "#6366f1" }}
          >
            {user.name.charAt(0)}{user.lastName.charAt(0)}
          </div>
        </div>

        <div className="space-y-2">
          {info.map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
                <p className="text-sm font-medium">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Localización GPS</p>
              <p className="text-xs text-muted-foreground">Se registra tu posición al fichar</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.gpsEnabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
              {user.gpsEnabled ? "Activado" : "Desactivado"}
            </span>
          </div>
        </div>

        {devMode && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium text-primary">Modo administrador activado</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-destructive/30 py-3 text-sm font-medium text-destructive hover:bg-destructive/5 active:scale-[0.98] transition-transform"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>

        <div className="pt-6 pb-4 text-center">
          <button
            type="button"
            onClick={() => setShowDevDialog(true)}
            className="text-[11px] text-muted-foreground/60 underline-offset-4 hover:text-muted-foreground hover:underline"
          >
            By Molotov Cóctel Creativo
          </button>
        </div>
      </main>

      {showDevDialog && <DevModeDialog onClose={() => setShowDevDialog(false)} />}
    </div>
  );
}

function DevModeDialog({ onClose }: { onClose: () => void }) {
  const { devMode, toggleDevMode } = useAppStore();
  const [pwd, setPwd] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = toggleDevMode(pwd);
    if (!ok) { toast.error("Contraseña incorrecta"); return; }
    setPwd("");
    onClose();
    toast.success(devMode ? "Modo administrador desactivado" : "Modo administrador activado");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xs rounded-2xl bg-background p-6 shadow-xl">
        <h2 className="text-base font-semibold text-center mb-1">
          {devMode ? "Desactivar" : "Activar"} modo administrador
        </h2>
        <p className="text-xs text-muted-foreground text-center mb-4">
          Introduce la contraseña para {devMode ? "desactivar" : "activar"} la edición manual de fichajes.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Contraseña"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-center"
            autoFocus
          />
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-input py-2.5 text-sm">
              Cancelar
            </button>
            <button type="submit" className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground">
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
