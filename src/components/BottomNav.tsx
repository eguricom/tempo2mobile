import { useAppStore } from "@/lib/store";
import { Link, useRouter } from "@tanstack/react-router";
import { Play, ClipboardList, User, Map, Settings } from "lucide-react";

const TABS = [
  { to: "/", icon: Play, label: "Inicio", adminOnly: false, devOnly: false },
  { to: "/mis-jornadas", icon: ClipboardList, label: "Jornadas", adminOnly: false, devOnly: false },
  { to: "/perfil", icon: User, label: "Perfil", adminOnly: false, devOnly: false },
  { to: "/admin", icon: Map, label: "Admin", adminOnly: false, devOnly: true },
  { to: "/usuarios", icon: Settings, label: "Usuarios", adminOnly: true, devOnly: false },
];

export function BottomNav() {
  const { sessionUserId, users, devMode } = useAppStore();
  const router = useRouter();
  const user = users.find((u) => u.id === sessionUserId);
  if (!sessionUserId) return null;

  const visible = TABS.filter((t) => {
    if (t.devOnly && !devMode) return false;
    if (t.adminOnly && user?.role !== "admin") return false;
    return true;
  });

  return (
    <nav className="flex items-center justify-around border-t bg-background px-2 pb-1 pt-1.5" style={{ paddingBottom: "calc(0.25rem + env(safe-area-inset-bottom, 0px))" }}>
      {visible.map((tab) => {
        const active = router.state.location.pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] font-medium transition-colors ${
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
