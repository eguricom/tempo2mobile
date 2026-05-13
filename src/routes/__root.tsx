import { Outlet, Link } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { LoginOverlay } from "@/components/LoginOverlay";
import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";

export default function RootLayout() {
  return (
    <>
      <DataLoader />
      <div className="flex min-h-dvh flex-col">
        <Outlet />
      </div>
      <Toaster position="top-center" />
      <LoginOverlay />
    </>
  );
}

function DataLoader() {
  const loaded = useAppStore((s) => s.loaded);
  useEffect(() => {
    useAppStore.setState({ loaded: true });
  }, []);
  return null;
}

export function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">La página que buscas no existe.</p>
        <div className="mt-6">
          <Link to="/" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
