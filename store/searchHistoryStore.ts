import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MAX_HISTORY = 8;

interface SearchHistoryStore {
  history: string[];
  push: (term: string) => void;
  remove: (term: string) => void;
  clear: () => void;
}

export const useSearchHistoryStore = create<SearchHistoryStore>()(
  persist(
    (set) => ({
      history: [],
      push: (term) => {
        const t = term.trim();
        if (!t) return;
        set((s) => ({
          history: [t, ...s.history.filter((h) => h !== t)].slice(0, MAX_HISTORY),
        }));
      },
      remove: (term) =>
        set((s) => ({ history: s.history.filter((h) => h !== term) })),
      clear: () => set({ history: [] }),
    }),
    {
      name: "streamhub-search-history",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
