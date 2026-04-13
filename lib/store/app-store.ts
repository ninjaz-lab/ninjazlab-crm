import {create} from "zustand";

interface AppState {
    // Sidebar
    isSidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    toggleSidebar: () => void;

    // Breadcrumbs
    dynamicName: string | null;
    setDynamicName: (name: string | null) => void;

    // Notifications
    unreadNotifications: number;
    setUnreadNotifications: (count: number) => void;
    decrementUnread: () => void;
    clearUnread: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Sidebar Implementation
    isSidebarCollapsed: false,
    setSidebarCollapsed: (collapsed) => set({isSidebarCollapsed: collapsed}),
    toggleSidebar: () => set((state) => ({isSidebarCollapsed: !state.isSidebarCollapsed})),

    // Breadcrumbs Implementation
    dynamicName: null,
    setDynamicName: (name) => set({dynamicName: name}),

    // Notifications
    unreadNotifications: 0,
    setUnreadNotifications: (count) => set({unreadNotifications: count}),
    decrementUnread: () => set((state) => ({
        unreadNotifications: Math.max(0, state.unreadNotifications - 1)
    })),
    clearUnread: () => set({unreadNotifications: 0}),
}));
