import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export function DataLoader() {
  const loaded = useAppStore((s) => s.loaded);
  useEffect(() => {
    useAppStore.setState({ loaded: true });
  }, []);
  return null;
}
