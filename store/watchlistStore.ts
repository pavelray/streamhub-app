import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WatchlistItem, WatchStatus } from "@/types";

interface WatchlistStore {
  items: WatchlistItem[];
  add: (item: Omit<WatchlistItem, "addedAt" | "status">) => void;
  remove: (id: number) => void;
  has: (id: number) => boolean;
  updateStatus: (id: number, status: WatchStatus) => void;
  clear: () => void;
}

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        if (!get().has(item.id)) {
          set((state) => ({
            items: [{ ...item, addedAt: Date.now(), status: "plan_to_watch" }, ...state.items],
          }));
        }
      },
      remove: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      has: (id) => get().items.some((i) => i.id === id),
      updateStatus: (id, status) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, status } : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "streamhub-watchlist",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
