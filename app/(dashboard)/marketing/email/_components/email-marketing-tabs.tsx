"use client";

import {useMemo, useState} from "react";
import Link from "next/link";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Button} from "@/components/ui/button";
import {HugeIcon} from "@/components/huge-icon";
import {DataTable} from "@/components/data-table";
import {getColumns, getTemplateColumns} from "../templates/_components/columns";

export function EmailMarketingTabs({
                                       campaigns,
                                       templates,
                                       initialTab
                                   }: {
    campaigns: any[];
    templates: any[];
    initialTab: string;
}) {
    const [activeTab, setActiveTab] = useState(initialTab);

    // Get table columns
    const campaignCols = useMemo(() => getColumns(), []);
    const templateCols = useMemo(() => getTemplateColumns(), []);

    // Custom Filter Fns to ensure deep searching (e.g. searching sender email)
    const campaignsFilterFn = (row: any, columnId: string, filterValue: string) => {
        const q = filterValue.toLowerCase();
        return (
            (row.original.name?.toLowerCase() || "").includes(q) ||
            (row.original.fromName?.toLowerCase() || "").includes(q) ||
            (row.original.fromEmail?.toLowerCase() || "").includes(q)
        );
    };

    const templatesFilterFn = (row: any, columnId: string, filterValue: string) => {
        const q = filterValue.toLowerCase();
        return (
            (row.original.name?.toLowerCase() || "").includes(q) ||
            (row.original.subject?.toLowerCase() || "").includes(q)
        );
    };

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <TabsList className="bg-muted/50 p-1 rounded-xl w-fit">
                    <TabsTrigger value="campaigns"
                                 className="font-bold rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <HugeIcon name="Megaphone01Icon" size={14} className="mr-2"/>
                        Campaigns ({campaigns.length})
                    </TabsTrigger>
                    <TabsTrigger value="templates"
                                 className="font-bold rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <HugeIcon name="Note01Icon" size={14} className="mr-2"/>
                        Templates ({templates.length})
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="campaigns" className="m-0 outline-none">
                <DataTable
                    columns={campaignCols}
                    data={campaigns}
                    searchPlaceholder="Search campaigns or senders..."
                    globalFilterFn={campaignsFilterFn}
                    actionSlot={
                        <Button asChild
                                className="w-full sm:w-auto font-black uppercase tracking-tighter shadow-lg shadow-primary/20">
                            <Link href="/marketing/email/campaigns/new">
                                <HugeIcon name="PlusSignIcon" size={16} className="mr-2"/>
                                New Campaign
                            </Link>
                        </Button>
                    }
                />
            </TabsContent>

            <TabsContent value="templates" className="m-0 outline-none">
                <DataTable
                    columns={templateCols}
                    data={templates}
                    searchPlaceholder="Search template names or subjects..."
                    globalFilterFn={templatesFilterFn}
                    actionSlot={
                        <Button asChild
                                className="w-full sm:w-auto font-black uppercase tracking-tighter shadow-lg shadow-primary/20">
                            <Link href="/marketing/email/templates/new">
                                <HugeIcon name="PlusSignIcon" size={16} className="mr-2"/>
                                New Template
                            </Link>
                        </Button>
                    }
                />
            </TabsContent>

        </Tabs>
    );
}