"use client";

import {useState} from "react";
import Link from "next/link";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Button} from "@/components/ui/button";
import {HugeIcon} from "@/components/huge-icon";
import {CampaignsTab} from "../campaigns/_components/campaigns-tab";
import {TemplatesTab} from "../templates/_components/templates-tab";

export function EmailDashboard(
    {
        campaigns,
        templates,
        initialTab
    }: {
        campaigns: any[];
        templates: any[];
        initialTab: string;
    }) {
    const [activeTab, setActiveTab] = useState(initialTab);

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <TabsList className="bg-muted/50 p-0 rounded-xl w-fit h-11 overflow-hidden">
                    <TabsTrigger value="campaigns"
                                 className="font-bold rounded-none px-6 h-full transition-all">
                        <HugeIcon name="Megaphone01Icon" size={14} className="mr-2"/>
                        Campaigns ({campaigns.length})
                    </TabsTrigger>
                    <TabsTrigger value="templates"
                                 className="font-bold rounded-none px-6 h-full transition-all">
                        <HugeIcon name="Note01Icon" size={14} className="mr-2"/>
                        Templates ({templates.length})
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="campaigns" className="m-0 outline-none">
                <CampaignsTab
                    data={campaigns}
                    actionSlot={
                        <Button asChild
                                className="w-full sm:w-auto font-black uppercase tracking-tighter shadow-lg shadow-primary/20">
                            <Link href="/email/campaigns/new">
                                <HugeIcon name="PlusSignIcon" size={16} className="mr-2"/>
                                Create
                            </Link>
                        </Button>
                    }
                />
            </TabsContent>

            <TabsContent value="templates" className="m-0 outline-none">
                <TemplatesTab
                    data={templates}
                    actionSlot={
                        <Button asChild
                                className="w-full sm:w-auto font-black uppercase tracking-tighter shadow-lg shadow-primary/20">
                            <Link href="/email/templates/new">
                                <HugeIcon name="PlusSignIcon" size={16} className="mr-2"/>
                                Create
                            </Link>
                        </Button>
                    }
                />
            </TabsContent>

        </Tabs>
    );
}