"use client";

import React, {useState} from "react";
import {Button} from "@/components/ui/button";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {HugeIcon} from "@/components/huge-icon";
import {DataTableFilter} from "@/components/data-table/data-table-filter";
import {PricingTabDefaults} from "./pricing-tab-defaults";
import {PricingTabOverrides} from "./pricing-tab-overrides";
import {PricingRuleDialog} from "./pricing-rule-dialog";
import {PricingDeleteDialog} from "./pricing-delete-dialog";
import {usePricingRuleForm} from "@/hooks/use-pricing-rule-form";
import {usePricingRules, Rule} from "@/hooks/use-pricing-rules";

export type {Rule};

type DbUser = {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role: string | null;
};

export function PricingDashboard({rules, users}: { rules: Rule[]; users: DbUser[] }) {
    const [activeTab, setActiveTab] = React.useState("defaults");
    const [comboboxOpen, setComboboxOpen] = React.useState(false);

    const {
        statusFilter,
        setStatusFilter,
        enrichedRules,
        getRuleStatus,
        filteredDefaultRules,
        filteredOverridesRules,
        filterOptions,
    } = usePricingRules({rules, users});

    const form = usePricingRuleForm(rules);

    function handleCreateNew() {
        form.resetForm();
        form.setDialogOpen(true);
    }

    return (
        <div className="space-y-4">

            {/* Header Layout */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                    <TabsList className="max-w-[400px]">
                        <TabsTrigger value="defaults">
                            <HugeIcon name="GlobalIcon" size={14} className="mr-2"/> Default Rates
                        </TabsTrigger>

                        <TabsTrigger value="overrides">
                            <HugeIcon name="UserIcon" size={14} className="mr-2"/> Custom Overrides
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <Button onClick={handleCreateNew} size="sm" className="font-medium">
                    <HugeIcon name="PlusSignIcon" size={16} className="mr-2"/> Create
                </Button>

            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-300">
                {activeTab === "defaults" && (
                    <PricingTabDefaults data={filteredDefaultRules}
                                        isPending={form.isPending}
                                        onEdit={form.handleEdit}
                                        onDelete={form.setRuleToDelete}
                                        actionSlot={
                                            <DataTableFilter icon="FilterIcon"
                                                             value={statusFilter}
                                                             onChange={setStatusFilter}
                                                             options={filterOptions}
                                            />
                                        }
                                        allRules={enrichedRules}
                    />
                )}
                {activeTab === "overrides" && (
                    <PricingTabOverrides data={filteredOverridesRules}
                                         isPending={form.isPending}
                                         onEdit={form.handleEdit}
                                         onDelete={form.setRuleToDelete}
                                         actionSlot={
                                            <DataTableFilter icon="FilterIcon"
                                                             value={statusFilter}
                                                             onChange={setStatusFilter}
                                                             options={filterOptions}
                                            />
                                        }
                                         allRules={enrichedRules}
                    />
                )}
            </div>
            
            <PricingRuleDialog open={form.dialogOpen}
                               onOpenChange={(o) => {
                                   if (!o) {
                                       form.setDialogOpen(false);
                                       form.resetForm();
                                   } else {
                                       form.setDialogOpen(true);
                                   }
                               }}
                               isEditing={!!form.editingRuleId}
                               isPending={form.isPending}
                               scope={form.scope}
                               onScopeChange={(scope) => form.setScope(scope as any)}
                               selectedUserId={form.selectedUserId}
                               onUserChange={form.setSelectedUserId}
                               campaign={form.campaign}
                               onCampaignChange={form.setCampaign}
                               unitPrice={form.unitPrice}
                               onPriceChange={form.setUnitPrice}
                               effectiveFrom={form.effectiveFrom}
                               onEffectiveFromChange={form.setEffectiveFrom}
                               note={form.note}
                               onNoteChange={form.setNote}
                               error={form.error}
                               onSave={form.handleSave}
                               onCancel={() => {
                                   form.setDialogOpen(false);
                                   form.resetForm();
                               }}
                               users={users}
                               comboboxOpen={comboboxOpen}
                               onComboboxOpenChange={setComboboxOpen}
            />

            <PricingDeleteDialog rule={form.ruleToDelete}
                                 onClose={() => form.setRuleToDelete(null)}
                                 onConfirm={() => {
                                     if (form.ruleToDelete) {
                                         form.handleDelete(form.ruleToDelete.id);
                                         form.setRuleToDelete(null);
                                     }
                                 }}
            />

        </div>
    );
}
