import { create } from 'zustand';

const RECENT_SEARCHES_KEY = 'space_learner_recent_searches_v1';

interface SearchState {
  isOpen: boolean;
  recentSearches: string[];
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

const getInitialRecentSearches = (): string[] => {
  try {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.slice(0, 8);
    }
  } catch (e) {
    console.error('Failed to load recent searches from localStorage:', e);
  }
  return ['Spanish', 'Pomodoro 25m', 'Study reflection', 'Focus stats'];
};

export const useSearchStore = create<SearchState>((set, get) => ({
  isOpen: false,
  recentSearches: getInitialRecentSearches(),

  openSearch: () => set({ isOpen: true }),
  closeSearch: () => set({ isOpen: false }),
  toggleSearch: () => set((state) => ({ isOpen: !state.isOpen })),

  addRecentSearch: (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const current = get().recentSearches;
    const filtered = current.filter(
      (item) => item.toLowerCase() !== trimmed.toLowerCase()
    );
    const updated = [trimmed, ...filtered].slice(0, 8);

    set({ recentSearches: updated });
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent searches:', e);
    }
  },

  removeRecentSearch: (query: string) => {
    const updated = get().recentSearches.filter(
      (item) => item.toLowerCase() !== query.toLowerCase()
    );
    set({ recentSearches: updated });
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update recent searches:', e);
    }
  },

  clearRecentSearches: () => {
    set({ recentSearches: [] });
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.error('Failed to clear recent searches:', e);
    }
  },
}));
