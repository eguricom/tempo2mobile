import { Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { LoginOverlay } from "@/components/LoginOverlay";
import { BottomNav } from "@/components/BottomNav";
import { DataLoader } from "@/components/DataLoader";

export default function RootLayout() {
  return (
    <>
      <DataLoader />
      <div className="flex min-h-dvh flex-col">
        <div className="flex-1 flex flex-col">
          <Outlet />
        </div>
        <BottomNav />
      </div>
      <Toaster position="top-center" />
      <LoginOverlay />
    </>
  );
}
