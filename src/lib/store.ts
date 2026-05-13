import { create } from "zustand";

export type Role = "admin" | "employee";

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  nif: string;
  role: Role;
  gpsEnabled: boolean;
  avatarColor?: string;
  passwordHash?: string;
}

export type ShiftStatus = "in_progress" | "paused" | "finished";

export interface GpsPoint {
  lat: number;
  lng: number;
  ts: string;
}

export interface Shift {
  id: string;
  userId: string;
  start: string;
  end: string | null;
  status: ShiftStatus;
  pauses: { start: string; end: string | null }[];
  gpsPoints: GpsPoint[];
}

type LockState = "locked" | "setup" | "unlocked";

interface AppState {
  loaded: boolean;
  lockState: LockState;
  sessionUserId: string | null;
  currentUserId: string;
  devMode: boolean;

  users: User[];
  shifts: Shift[];

  setCurrentUser: (id: string) => void;
  login: (nif: string) => Promise<User | null>;
  logout: () => void;
  toggleDevMode: () => void;

  addUser: (u: Omit<User, "id" | "passwordHash">) => void;
  updateUser: (id: string, u: Partial<User>) => void;
  deleteUser: (id: string) => void;

  startShift: (userId: string, lat?: number, lng?: number) => void;
  pauseShift: (userId: string, lat?: number, lng?: number) => void;
  resumeShift: (userId: string, lat?: number, lng?: number) => void;
  endShift: (userId: string, lat?: number, lng?: number) => void;
  addGpsPoint: (userId: string, lat: number, lng: number) => void;

  unlock: (code: string) => Promise<boolean>;
}

const uid = () => Math.random().toString(36).slice(2, 10);

function saveToLocal(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

function loadFromLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback }
}

const seedMobileUsers: User[] = [
  {
    id: "seed-julio",
    name: "Julio",
    lastName: "González",
    email: "julio@molotov.es",
    nif: "12345678Z",
    role: "admin",
    gpsEnabled: true,
    avatarColor: "#3b82f6",
    passwordHash: "00b72afbae521af2e19886f1ebb09aa1b6280e68043b57914629b346be54db64",
  },
  {
    id: "seed-edu",
    name: "Edu",
    lastName: "Gutierrez",
    email: "edu@molotov.es",
    nif: "87654321X",
    role: "employee",
    gpsEnabled: true,
    avatarColor: "#f59e0b",
    passwordHash: "00b72afbae521af2e19886f1ebb09aa1b6280e68043b57914629b346be54db64",
  },
];

const savedUsers = loadFromLocal<User[]>("tempo2m-users", []);
const isFirstVisit = savedUsers.length === 0;
const initialUsers = isFirstVisit ? (() => { saveToLocal("tempo2m-users", seedMobileUsers); return seedMobileUsers; })() : savedUsers;

export const useAppStore = create<AppState>()((set, get) => ({
  loaded: false,
  lockState: isFirstVisit ? "unlocked" : loadFromLocal<LockState>("tempo2m-lock", "locked"),
  sessionUserId: loadFromLocal<string | null>("tempo2m-session", null),
  currentUserId: loadFromLocal("tempo2m-current", ""),
  devMode: loadFromLocal("tempo2m-dev", false),

  users: initialUsers,
  shifts: loadFromLocal<Shift[]>("tempo2m-shifts", []),

  setCurrentUser: (id) => { set({ currentUserId: id }); saveToLocal("tempo2m-current", id); },

  login: async (nif) => {
    const state = get();
    const user = state.users.find((u) => u.nif === nif.trim());
    if (!user) return null;
    let valid = user.nif === nif.trim();
    if (user.passwordHash) {
      const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("Tempo2024!" + nif));
      const hex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
      valid = hex === user.passwordHash;
    }
    if (!valid) return null;
    set({ sessionUserId: user.id, currentUserId: user.id });
    saveToLocal("tempo2m-session", user.id);
    saveToLocal("tempo2m-current", user.id);
    return user;
  },

  logout: () => {
    set({ sessionUserId: null, currentUserId: "" });
    saveToLocal("tempo2m-session", null);
    saveToLocal("tempo2m-current", "");
  },

  toggleDevMode: () => set((s) => {
    const next = !s.devMode;
    saveToLocal("tempo2m-dev", next);
    return { devMode: next };
  }),

  addUser: (u) => set((s) => {
    const users = [...s.users, { ...u, id: uid() }];
    saveToLocal("tempo2m-users", users);
    return { users };
  }),

  updateUser: (id, u) => set((s) => {
    const users = s.users.map((x) => x.id === id ? { ...x, ...u } : x);
    saveToLocal("tempo2m-users", users);
    return { users };
  }),

  deleteUser: (id) => set((s) => {
    const users = s.users.filter((x) => x.id !== id);
    saveToLocal("tempo2m-users", users);
    return { users };
  }),

  startShift: (userId, lat, lng) => {
    const shift: Shift = {
      id: uid(),
      userId,
      start: new Date().toISOString(),
      end: null,
      status: "in_progress",
      pauses: [],
      gpsPoints: lat && lng ? [{ lat, lng, ts: new Date().toISOString() }] : [],
    };
    set((s) => {
      const shifts = [...s.shifts, shift];
      saveToLocal("tempo2m-shifts", shifts);
      return { shifts };
    });
  },

  pauseShift: (userId, lat, lng) => set((s) => {
    const shifts = s.shifts.map((sh) =>
      sh.userId === userId && sh.status === "in_progress"
        ? {
            ...sh,
            status: "paused" as const,
            pauses: [...sh.pauses, { start: new Date().toISOString(), end: null }],
            gpsPoints: lat && lng ? [...sh.gpsPoints, { lat, lng, ts: new Date().toISOString() }] : sh.gpsPoints,
          }
        : sh,
    );
    saveToLocal("tempo2m-shifts", shifts);
    return { shifts };
  }),

  resumeShift: (userId, lat, lng) => set((s) => {
    const shifts = s.shifts.map((sh) =>
      sh.userId === userId && sh.status === "paused"
        ? {
            ...sh,
            status: "in_progress" as const,
            pauses: sh.pauses.map((p, i, arr) => i === arr.length - 1 ? { ...p, end: new Date().toISOString() } : p),
            gpsPoints: lat && lng ? [...sh.gpsPoints, { lat, lng, ts: new Date().toISOString() }] : sh.gpsPoints,
          }
        : sh,
    );
    saveToLocal("tempo2m-shifts", shifts);
    return { shifts };
  }),

  endShift: (userId, lat, lng) => set((s) => {
    const shifts = s.shifts.map((sh) =>
      sh.userId === userId && (sh.status === "in_progress" || sh.status === "paused")
        ? {
            ...sh,
            status: "finished" as const,
            end: new Date().toISOString(),
            pauses: sh.status === "paused"
              ? sh.pauses.map((p, i, arr) => i === arr.length - 1 ? { ...p, end: new Date().toISOString() } : p)
              : sh.pauses,
            gpsPoints: lat && lng ? [...sh.gpsPoints, { lat, lng, ts: new Date().toISOString() }] : sh.gpsPoints,
          }
        : sh,
    );
    saveToLocal("tempo2m-shifts", shifts);
    return { shifts };
  }),

  addGpsPoint: (userId, lat, lng) => set((s) => {
    const shifts = s.shifts.map((sh) =>
      sh.userId === userId && (sh.status === "in_progress" || sh.status === "paused")
        ? { ...sh, gpsPoints: [...sh.gpsPoints, { lat, lng, ts: new Date().toISOString() }] }
        : sh,
    );
    saveToLocal("tempo2m-shifts", shifts);
    return { shifts };
  }),

  unlock: async (code) => {
    const valid = import.meta.env.VITE_UNLOCK_CODE || "tempo-molotov-2024";
    if (code !== valid) return false;
    set({ lockState: "setup" });
    saveToLocal("tempo2m-lock", "setup");
    return true;
  },
}));
