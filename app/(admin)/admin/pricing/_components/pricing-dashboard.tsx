"use client";

import React, {useMemo} from "react";
import {Button} from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {HugeIcon} from "@/components/huge-icon";
import {PricingTabDefaults} from "./pricing-tab-defaults";
import {PricingTabOverrides} from "./pricing-tab-overrides";
import {PricingRuleDialog} from "./pricing-rule-dialog";
import {usePricingRuleForm} from "@/hooks/use-pricing-rule-form";

export type Rule = {
    id: string;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    userImage: string | null;
    role?: string | null;
    campaign: string;
    action: string;
    unitPrice: string;
    currency: string;
    effectiveFrom: Date;
    note: string | null;
    createdAt: Date;
};

type DbUser = {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role: string | null
};

export function PricingDashboard({rules, users}: { rules: Rule[]; users: DbUser[] }) {
    const [activeTab, setActiveTab] = React.useState("defaults");
    const [comboboxOpen, setComboboxOpen] = React.useState(false);

    const userRoleMap = useMemo(() => {
        const map: Record<string, string> = {};
        users.forEach(u => {
            if (u.id && u.role) map[u.id] = u.role;
        });
        return map;
    }, [users]);

    const enrichedRules = useMemo(() => {
        return rules.map(r => ({
            ...r,
            role: r.userId ? userRoleMap[r.userId] || null : null,
        }));
    }, [rules, userRoleMap]);

    const form = usePricingRuleForm(rules);

    // Split Data for Tabs
    const defaultRules = useMemo(() => enrichedRules.filter((r) => !r.userId), [enrichedRules]);
    const overridesRules = useMemo(() => enrichedRules.filter((r) => !!r.userId), [enrichedRules]);

    const CreateRuleAction = (
        <Button onClick={() => {
            form.resetForm();
            form.setDialogOpen(true);
        }}
                className="w-full sm:w-auto font-black uppercase tracking-tighter shadow-lg shadow-primary/20"
        >
            <HugeIcon name="PlusSignIcon" size={16} className="mr-2"/>
            Create Rule
        </Button>
    );

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <TabsList className="max-w-[400px]">
                    <TabsTrigger value="defaults">
                        <HugeIcon name="GlobalIcon" size={14} className="mr-2"/> Default Rates
                    </TabsTrigger>

                    <TabsTrigger value="overrides">
                        <HugeIcon name="UserIcon" size={14} className="mr-2"/> Custom Overrides
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="defaults" className="m-0 outline-none">
                <PricingTabDefaults data={defaultRules}
                                    isPending={form.isPending}
                                    onEdit={form.handleEdit}
                                    onDelete={form.setRuleToDelete}
                                    actionSlot={CreateRuleAction}
                />
            </TabsContent>

            <TabsContent value="overrides" className="m-0 outline-none">
                <PricingTabOverrides data={overridesRules}
                                     isPending={form.isPending}
                                     onEdit={form.handleEdit}
                                     onDelete={form.setRuleToDelete}
                                     actionSlot={CreateRuleAction}
                />
            </TabsContent>

            {/* --- Modals --- */}
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

            <AlertDialog open={!!form.ruleToDelete} onOpenChange={(o) => {
                if (!o) form.setRuleToDelete(null);
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this pricing rule?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {form.ruleToDelete?.userId
                                ? `This will remove the custom rate for ${form.ruleToDelete.userName}. They will fall back to the default pricing.`
                                : "This will remove this default rate. Users without a custom override will no longer be charged for this campaign."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="font-bold">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (form.ruleToDelete) {
                                form.handleDelete(form.ruleToDelete.id);
                                form.setRuleToDelete(null);
                            }
                        }} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold">
                            Confirm Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Tabs>
    );
}
