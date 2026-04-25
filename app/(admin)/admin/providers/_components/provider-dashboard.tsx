"use client";

import React, {useMemo, useState} from "react";
import {Button} from "@/components/ui/button";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {HugeIcon} from "@/components/huge-icon";
import {ProviderTabDefaults} from "./provider-tab-defaults";
import {ProviderTabOverrides} from "./provider-tab-overrides";
import {ProviderFormDialog} from "./provider-form-dialog";
import {ProviderDeleteDialog} from "./provider-delete-dialog";

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

type DbUser = { id: string; name: string; email: string };

export function ProviderDashboard({
                                      providers,
                                      users
                                  }: {
                                      providers: ProviderConfig[];
                                      users: DbUser[]
                                  }
) {
    // UI State
    const [activeTab, setActiveTab] = useState("defaults");
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Target State for Modals
    const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null);
    const [providerToDelete, setProviderToDelete] = useState<ProviderConfig | null>(null);

    function handleEdit(provider: ProviderConfig) {
        setEditingProvider(provider);
        setIsFormOpen(true);
    }

    function handleCreateNew() {
        setEditingProvider(null);
        setIsFormOpen(true);
    }

    const defaultProviders = useMemo(() => providers.filter((r) => !r.userId), [providers]);
    const overridesProviders = useMemo(() => providers.filter((r) => !!r.userId), [providers]);

    return (
        <div className="space-y-4">

            {/* Header Layout */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-[400px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <TabsList className="max-w-[400px]">
                            <TabsTrigger value="defaults">
                                <HugeIcon name="GlobalIcon" size={14} className="mr-2"/> Global Providers
                            </TabsTrigger>

                            <TabsTrigger value="overrides">
                                <HugeIcon name="UserIcon" size={14} className="mr-2"/> Tenant Overrides
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </Tabs>

                <Button onClick={handleCreateNew} size="sm" className="font-medium">
                    <HugeIcon name="PlusSignIcon" size={16} className="mr-2"/> Create
                </Button>

            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-300">
                {activeTab === "defaults" && (
                    <ProviderTabDefaults data={defaultProviders}
                                         isPending={false}
                                         onEdit={handleEdit}
                                         onDelete={setProviderToDelete}
                                         actionSlot={null}/>
                )}
                {activeTab === "overrides" && (
                    <ProviderTabOverrides data={overridesProviders}
                                          isPending={false}
                                          onEdit={handleEdit}
                                          onDelete={setProviderToDelete}
                                          actionSlot={null}/>
                )}
            </div>

            {/* Extracted Modals */}
            <ProviderFormDialog open={isFormOpen}
                                onOpenChange={setIsFormOpen}
                                editingProvider={editingProvider}
                                users={users}/>

            <ProviderDeleteDialog provider={providerToDelete}
                                  onClose={() => setProviderToDelete(null)}/>

        </div>
    );
}