import {create} from "zustand";

interface AppState {
    unreadNotifications: number;
    setUnreadNotifications: (count: number) => void;
    decrementUnread: () => void;
    clearUnread: () => void;

    // You can easily add other global states here later!
    // isSidebarOpen: boolean;
    // toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    unreadNotifications: 0,

    setUnreadNotifications: (count) => set({unreadNotifications: count}),

    decrementUnread: () => set((state) => ({
        unreadNotifications: Math.max(0, state.unreadNotifications - 1)
    })),

    clearUnread: () => set({unreadNotifications: 0}),
}));
