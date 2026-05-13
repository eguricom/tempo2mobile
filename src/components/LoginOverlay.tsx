import { useState } from "react";
import { useAppStore, type User } from "@/lib/store";
import { toast } from "sonner";

export function LoginOverlay() {
  const sessionUserId = useAppStore((s) => s.sessionUserId);
  const lockState = useAppStore((s) => s.lockState);
  const users = useAppStore((s) => s.users);

  if (lockState === "locked") return <BlockedScreen />;
  if (lockState === "setup") return <SetupScreen />;
  if (sessionUserId) return null;
  return <LoginScreen />;
}

function BlockedScreen() {
  const unlock = useAppStore((s) => s.unlock);
  const [code, setCode] = useState("");

  const handleUnlock = async () => {
    const ok = await unlock(code);
    if (ok) toast.success("App desbloqueada. Configura el administrador.");
    else toast.error("Código incorrecto");
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
          TM
        </div>
        <div>
          <h1 className="text-xl font-semibold">Tempo Mobile</h1>
          <p className="text-sm text-muted-foreground mt-1">By Molotov Cóctel Creativo SLU</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Aplicación bloqueada. Introduce el código de desbloqueo.
        </p>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-center"
          onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
        />
        <button onClick={handleUnlock} className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground">
          Desbloquear
        </button>
      </div>
    </div>
  );
}

function SetupScreen() {
  const addUser = useAppStore((s) => s.addUser);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [nif, setNif] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !lastName.trim() || !email.trim() || !nif.trim()) {
      toast.error("Rellena todos los campos"); return;
    }
    addUser({ name: name.trim(), lastName: lastName.trim(), email: email.trim(), nif: nif.trim(), role: "admin", gpsEnabled: false });
    useAppStore.setState({ lockState: "unlocked" });
    localStorage.setItem("tempo2m-lock", JSON.stringify("unlocked"));
    toast.success("Administrador creado. Inicia sesión con tu NIF.");
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-xl font-semibold text-center">Configurar administrador</h1>
        <p className="text-sm text-muted-foreground text-center">Crea el primer usuario para acceder.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" autoFocus />
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Primer apellido" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <input value={nif} onChange={(e) => setNif(e.target.value)} placeholder="NIF (contraseña 1er acceso)" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <button type="submit" className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground">
            Crear administrador
          </button>
        </form>
      </div>
    </div>
  );
}

function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const [nif, setNif] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nif.trim()) { toast.error("Introduce tu NIF"); return; }
    setLoading(true);
    const user = await login(nif);
    setLoading(false);
    if (!user) { toast.error("Credenciales incorrectas"); return; }
    toast.success(`Bienvenido/a, ${user.name}`);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
            TM
          </div>
          <h1 className="text-xl font-semibold">Tempo Mobile</h1>
          <p className="text-xs text-muted-foreground">By Molotov Cóctel Creativo SLU</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            value={nif}
            onChange={(e) => setNif(e.target.value)}
            placeholder="NIF / Contraseña"
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-center"
            autoFocus
          />
          <button type="submit" disabled={loading} className="w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
