import {create} from "zustand";

interface AppState {
    // Notifications
    unreadNotifications: number;
    setUnreadNotifications: (count: number) => void;
    decrementUnread: () => void;
    clearUnread: () => void;

    // Breadcrumbs
    dynamicName: string | null;
    setDynamicName: (name: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Notifications
    unreadNotifications: 0,
    setUnreadNotifications: (count) => set({unreadNotifications: count}),
    decrementUnread: () => set((state) => ({
        unreadNotifications: Math.max(0, state.unreadNotifications - 1)
    })),
    clearUnread: () => set({unreadNotifications: 0}),

    // Breadcrumbs Implementation
    dynamicName: null,
    setDynamicName: (name) => set({dynamicName: name}),
}));
