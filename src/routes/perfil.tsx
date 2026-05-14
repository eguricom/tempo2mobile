import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { User, Mail, Fingerprint, Shield, LogOut } from "lucide-react";

export default function PerfilPage() {
  const { sessionUserId, users, logout } = useAppStore();
  const user = users.find((u) => u.id === sessionUserId);
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
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b bg-background/80 px-4 py-3 backdrop-blur">
        <h1 className="text-base font-semibold">Mi perfil</h1>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* Avatar */}
        <div className="flex flex-col items-center py-6">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
            style={{ backgroundColor: user.avatarColor || "#6366f1" }}
          >
            {user.name.charAt(0)}{user.lastName.charAt(0)}
          </div>
        </div>

        {/* Info cards */}
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

        {/* GPS status */}
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

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-destructive/30 py-3 text-sm font-medium text-destructive hover:bg-destructive/5 active:scale-[0.98] transition-transform"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </main>
    </div>
  );
}
