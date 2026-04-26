import {useMemo, useState} from "react";

export type ProviderConfig = {
    id: string;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    userImage: string | null;
    channel: string;
    name: string;
    config: any;
    isDefault: boolean;
    updatedAt: Date | string;
};

interface UseProviderDashboardProps {
    providers: ProviderConfig[];
}

export function useProviderDashboard({providers}: UseProviderDashboardProps) {
    const [activeTab, setActiveTab] = useState("defaults");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null);
    const [providerToDelete, setProviderToDelete] = useState<ProviderConfig | null>(null);

    const defaultProviders = useMemo(() => providers.filter((r) => !r.userId), [providers]);
    const overridesProviders = useMemo(() => providers.filter((r) => !!r.userId), [providers]);

    const handleEdit = (provider: ProviderConfig) => {
        setEditingProvider(provider);
        setIsFormOpen(true);
    };

    const handleCreateNew = () => {
        setEditingProvider(null);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingProvider(null);
    };

    return {
        activeTab,
        setActiveTab,
        isFormOpen,
        setIsFormOpen,
        editingProvider,
        setEditingProvider,
        providerToDelete,
        setProviderToDelete,
        defaultProviders,
        overridesProviders,
        handleEdit,
        handleCreateNew,
        handleCloseForm,
    };
}
