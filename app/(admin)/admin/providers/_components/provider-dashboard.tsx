"use client";

import React from "react";
import {Button} from "@/components/ui/button";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {HugeIcon} from "@/components/huge-icon";
import {ProviderTabDefaults} from "./provider-tab-defaults";
import {ProviderTabOverrides} from "./provider-tab-overrides";
import {ProviderFormDialog} from "./provider-form-dialog";
import {ProviderDeleteDialog} from "./provider-delete-dialog";
import {useProviderDashboard, ProviderConfig} from "@/hooks/use-provider-dashboard";

export type {ProviderConfig};

type DbUser = { id: string; name: string; email: string };

export function ProviderDashboard({
                                      providers,
                                      users
                                  }: {
                                      providers: any[];
                                      users: DbUser[]
                                  }
) {
    const {
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
    } = useProviderDashboard({providers});

    return (
        <div className="space-y-4">

            {/* Header Layout */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-[400px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <TabsList className="max-w-[400px]">
                            <TabsTrigger value="defaults">
                                <HugeIcon name="GlobalIcon" size={14} className="mr-2"/> Default Providers
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

                {/* Default Tab */}
                {activeTab === "defaults" && (
                    <ProviderTabDefaults data={defaultProviders}
                                         isPending={false}
                                         onEdit={handleEdit}
                                         onDelete={setProviderToDelete}
                                         actionSlot={null}/>
                )}

                {/* Overrides Tab */}
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