import {unstable_noStore as noStore} from "next/cache";
import {fetchEmailCampaigns} from "@/lib/actions/email-marketing";
import {fetchEmailTemplates} from "@/lib/actions/email-template";
import {HugeIcon} from "@/components/huge-icon";
import {EmailMarketingTabs} from "./_components/email-marketing-tabs";

export default async function EmailMarketingPage({searchParams}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    noStore();
    const [campaigns, templates] = await Promise.all([
        fetchEmailCampaigns(),
        fetchEmailTemplates(),
    ]);

    const {tab} = await searchParams;
    const activeTab = typeof tab === "string" && ["campaigns", "templates"].includes(tab)
        ? tab
        : "campaigns";

    const totalSent = campaigns.reduce((s, c) => s + (c.sentCount ?? 0), 0);
    const totalOpened = campaigns.reduce((s, c) => s + (c.openedCount ?? 0), 0);
    const avgOpenRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0.0";

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">

            <div className="flex items-end justify-between border-b pb-4">
                <div className="space-y-0.5">
                    <h1 className="text-xl font-black tracking-tight uppercase">Email Marketing</h1>
                    <p className="text-xs font-medium text-muted-foreground">
                        Create, schedule and track email campaigns • <span
                        className="text-primary uppercase font-black tracking-widest text-[9px]">Workspace</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <div
                        className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                        <HugeIcon name="Mail01Icon" size={16}/>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <div
                    className="p-5 rounded-xl border bg-card shadow-sm flex flex-col gap-2 relative overflow-hidden group">
                    <div
                        className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-5 transition-opacity duration-500">
                        <HugeIcon name="Megaphone01Icon" size={100}/>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground relative z-10">
                        <HugeIcon name="Megaphone01Icon" size={14}/>
                        <span className="text-[10px] font-black uppercase tracking-widest">Total Campaigns</span>
                    </div>
                    <div className="text-3xl font-black tracking-tighter relative z-10">{campaigns.length}</div>
                </div>

                <div
                    className="p-5 rounded-xl border bg-card shadow-sm flex flex-col gap-2 relative overflow-hidden group">
                    <div
                        className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-5 transition-opacity duration-500">
                        <HugeIcon name="Note01Icon" size={100}/>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground relative z-10">
                        <HugeIcon name="Note01Icon" size={14}/>
                        <span className="text-[10px] font-black uppercase tracking-widest">Saved Templates</span>
                    </div>
                    <div className="text-3xl font-black tracking-tighter relative z-10">{templates.length}</div>
                </div>

                <div
                    className="p-5 rounded-xl border bg-card shadow-sm flex flex-col gap-2 relative overflow-hidden group">
                    <div
                        className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-5 transition-opacity duration-500">
                        <HugeIcon name="SentIcon" size={100}/>
                    </div>
                    <div className="flex items-center gap-2 text-primary relative z-10">
                        <div className="p-1 bg-primary/10 rounded-md">
                            <HugeIcon name="SentIcon" size={14}/>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Emails Sent</span>
                    </div>
                    <div
                        className="text-3xl font-black tracking-tighter text-primary relative z-10">{totalSent.toLocaleString()}</div>
                </div>

                <div
                    className="p-5 rounded-xl border bg-card shadow-sm flex flex-col gap-2 relative overflow-hidden group">
                    <div
                        className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-5 transition-opacity duration-500">
                        <HugeIcon name="ViewIcon" size={100}/>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 relative z-10">
                        <div className="p-1 bg-emerald-500/10 rounded-md">
                            <HugeIcon name="ViewIcon" size={14}/>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Avg Open Rate</span>
                    </div>
                    <div
                        className="text-3xl font-black tracking-tighter text-emerald-600 relative z-10">{avgOpenRate}%
                    </div>
                </div>
            </div>

            <EmailMarketingTabs
                campaigns={campaigns}
                templates={templates}
                initialTab={activeTab}
            />
        </div>
    );
}