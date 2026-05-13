import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

export default function UsuariosPage() {
  const { users, addUser, updateUser, deleteUser, devMode } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [nif, setNif] = useState("");
  const [gpsEnabled, setGpsEnabled] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !lastName.trim() || !email.trim() || !nif.trim()) {
      toast.error("Rellena todos los campos"); return;
    }
    addUser({ name: name.trim(), lastName: lastName.trim(), email: email.trim(), nif: nif.trim(), role: "employee", gpsEnabled });
    toast.success("Usuario creado");
    setName(""); setLastName(""); setEmail(""); setNif(""); setGpsEnabled(false);
    setShowForm(false);
  };

  const toggleGps = (userId: string, current: boolean) => {
    updateUser(userId, { gpsEnabled: !current });
    toast.success(`GPS ${current ? "desactivado" : "activado"}`);
  };

  // Assign colors to users
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];
  const userColor = (i: number) => colors[i % colors.length];

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="rounded-md p-1 hover:bg-accent"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-base font-semibold">Usuarios</h1>
        </div>
        <button onClick={() => setShowForm(true)} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" /> Nuevo
        </button>
      </header>

      <main className="flex-1 p-4 space-y-2">
        {users.filter((u) => devMode || true).map((u, i) => (
          <div key={u.id} className="flex items-center justify-between rounded-lg border bg-card px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: userColor(i) }}>
                {u.name.charAt(0)}{u.lastName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium">{u.name} {u.lastName}</p>
                <p className="text-xs text-muted-foreground">{u.email} {u.role === "admin" && <span className="text-primary font-medium">· Admin</span>}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleGps(u.id, u.gpsEnabled)}
                className={`rounded-md px-2 py-1 text-xs font-medium flex items-center gap-1 ${u.gpsEnabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {u.gpsEnabled ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                GPS
              </button>
              <button onClick={() => { deleteUser(u.id); toast.success("Usuario eliminado"); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No hay usuarios. Crea el primero.</p>
        )}
      </main>

      {/* Create user sheet */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-background p-6 shadow-xl">
            <h2 className="text-base font-semibold mb-4">Nuevo usuario</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" autoFocus />
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Primer apellido" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <input value={nif} onChange={(e) => setNif(e.target.value)} placeholder="NIF" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <label className="flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer">
                <input type="checkbox" checked={gpsEnabled} onChange={(e) => setGpsEnabled(e.target.checked)} className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Este usuario necesita localización</p>
                  <p className="text-xs text-muted-foreground">Registrará posición GPS al fichar</p>
                </div>
              </label>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-input py-2.5 text-sm">Cancelar</button>
                <button type="submit" className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
