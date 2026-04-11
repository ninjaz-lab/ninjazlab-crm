import {create} from "zustand";

export type AppModule = {
    id: string;
    title: string;
    href: string;
    iconName: string;
    exact?: boolean | null;
};

interface ModuleState {
    adminModules: AppModule[];
    userModules: AppModule[];

    setAdminModules: (modules: AppModule[]) => void;
    setUserModules: (modules: AppModule[]) => void;
}

export const useModuleStore = create<ModuleState>((set) => ({
    adminModules: [],
    userModules: [],

    setAdminModules: (modules) => set({adminModules: modules}),
    setUserModules: (modules) => set({userModules: modules}),
}));