"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {HugeIcon} from "@/components/huge-icon";
import {updateEmailCampaign} from "@/lib/actions/email-marketing";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {CAMPAIGN_STATUS} from "@/lib/enums";
import {cn} from "@/lib/utils/utils";

type Template = { id: string; name: string; subject: string | null; status: string };
type Segment = { id: string; name: string; count: number };
type SendMode = "draft" | "now" | "schedule";

export function EditCampaignForm({
                                     campaign,
                                     detail,
                                     templates = [],
                                     segments = []
                                 }: {
    campaign: any;
    detail: any;
    templates?: Template[];
    segments?: Segment[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [sendMode, setSendMode] = useState<SendMode>(
        campaign.status === CAMPAIGN_STATUS.SCHEDULED ? "schedule" : "draft"
    );
    const [scheduledAt, setScheduledAt] = useState<string>(
        campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : ""
    );

    const publishedTemplates = templates.filter((t) => t.status === CAMPAIGN_STATUS.PUBLISHED);

    async function onSubmit(formData: FormData) {
        // Validate Schedule
        if (sendMode === "schedule" && !scheduledAt) {
            toast.error("Please select a date and time to schedule the campaign.");
            return;
        }

        // Inject Delivery states into standard form data
        formData.append("sendMode", sendMode);
        if (scheduledAt) formData.append("scheduledAt", scheduledAt);

        startTransition(async () => {
            try {
                await updateEmailCampaign(campaign.id, formData);
                toast.success("Campaign updated successfully!");
                router.push(`/email/campaigns/${campaign.id}`);
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Failed to update campaign.");
            }
        });
    }

    const buttonConfig = {
        draft: {text: "Update as Draft", icon: "PencilEdit01Icon"},
        now: {text: "Update & Send Now", icon: "SentIcon"},
        schedule: {text: "Update & Schedule", icon: "Calendar04Icon"}
    };

    return (
        <form action={onSubmit} className="grid gap-8 lg:grid-cols-2 items-start w-full">

            {/* LEFT COLUMN: Settings & Tracking */}
            <div className="space-y-8">
                {/* 1. General Settings */}
                <div className="bg-background border border-muted-foreground/20 shadow-sm rounded-xl overflow-hidden">
                    <div className="bg-muted/30 border-b border-muted-foreground/10 px-6 py-4 flex items-center gap-3">
                        <div className="p-2 bg-background rounded-lg shadow-sm border border-muted-foreground/10">
                            <HugeIcon name="Mail01Icon" size={16} className="text-primary"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground leading-tight">Campaign Settings</h3>
                            <p className="text-xs text-muted-foreground font-medium">Basic info and sender details</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="name"
                                   className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Campaign
                                Name</Label>
                            <Input id="name" name="name" defaultValue={campaign.name} required
                                   className="h-10 bg-muted/10 hover:bg-muted/30 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-lg"/>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="fromName"
                                       className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">From
                                    Name</Label>
                                <Input id="fromName" name="fromName" defaultValue={detail.fromName} required
                                       className="h-10 bg-muted/10 hover:bg-muted/30 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-lg"/>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="fromEmail"
                                       className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">From
                                    Email</Label>
                                <Input id="fromEmail" name="fromEmail" type="email" defaultValue={detail.fromEmail}
                                       required
                                       className="h-10 bg-muted/10 hover:bg-muted/30 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-lg"/>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="replyTo"
                                   className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reply-To
                                (Optional)</Label>
                            <Input id="replyTo" name="replyTo" type="email" defaultValue={detail.replyTo || ""}
                                   className="h-10 bg-muted/10 hover:bg-muted/30 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-lg"/>
                        </div>
                    </div>
                </div>

                {/* 3. UTM Tracking */}
                <div className="bg-background border border-muted-foreground/20 shadow-sm rounded-xl overflow-hidden">
                    <div className="bg-muted/30 border-b border-muted-foreground/10 px-6 py-4 flex items-center gap-3">
                        <div className="p-2 bg-background rounded-lg shadow-sm border border-muted-foreground/10">
                            <HugeIcon name="Link01Icon" size={16} className="text-primary"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground leading-tight">Tracking Parameters</h3>
                            <p className="text-xs text-muted-foreground font-medium">Google Analytics UTM tags
                                (Optional)</p>
                        </div>
                    </div>
                    <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="utmSource"
                                   className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Source</Label>
                            <Input id="utmSource" name="utmSource" defaultValue={detail.utmSource || ""}
                                   placeholder="newsletter"
                                   className="h-10 bg-muted/10 hover:bg-muted/30 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-lg"/>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="utmMedium"
                                   className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Medium</Label>
                            <Input id="utmMedium" name="utmMedium" defaultValue={detail.utmMedium || ""}
                                   placeholder="email"
                                   className="h-10 bg-muted/10 hover:bg-muted/30 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-lg"/>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="utmCampaign"
                                   className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Campaign</Label>
                            <Input id="utmCampaign" name="utmCampaign" defaultValue={detail.utmCampaign || ""}
                                   placeholder="q3_launch"
                                   className="h-10 bg-muted/10 hover:bg-muted/30 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-lg"/>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Audience & Actions */}
            <div className="space-y-8">
                {/* 2. Content & Audience */}
                <div className="bg-background border border-muted-foreground/20 shadow-sm rounded-xl overflow-hidden">
                    <div className="bg-muted/30 border-b border-muted-foreground/10 px-6 py-4 flex items-center gap-3">
                        <div className="p-2 bg-background rounded-lg shadow-sm border border-muted-foreground/10">
                            <HugeIcon name="UserMultiple01Icon" size={16} className="text-primary"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground leading-tight">Content & Audience</h3>
                            <p className="text-xs text-muted-foreground font-medium">Update the template or target
                                segment</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Design
                                Template</Label>
                            {publishedTemplates.length === 0 ? (
                                <Alert className="bg-muted/20 border-primary/20 text-primary">
                                    <HugeIcon name="Alert01Icon" size={16}/>
                                    <AlertDescription className="ml-2 font-medium">No published templates
                                        found.</AlertDescription>
                                </Alert>
                            ) : (
                                <Select name="templateId" defaultValue={campaign.templateId}>
                                    <SelectTrigger
                                        className="h-10 bg-muted/10 hover:bg-muted/30 transition-all rounded-lg font-medium">
                                        <SelectValue placeholder="Select a template..."/>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-xl">
                                        {publishedTemplates.map((t) => (
                                            <SelectItem key={t.id} value={t.id} className="font-medium cursor-pointer">
                                                {t.name} <span
                                                className="text-muted-foreground ml-2">— {t.subject}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target
                                Audience</Label>
                            {segments.length === 0 ? (
                                <Alert className="bg-muted/20 border-primary/20 text-primary">
                                    <HugeIcon name="Alert01Icon" size={16}/>
                                    <AlertDescription className="ml-2 font-medium">No segments yet.</AlertDescription>
                                </Alert>
                            ) : (
                                <Select name="listId" defaultValue={campaign.listId}>
                                    <SelectTrigger
                                        className="h-10 bg-muted/10 hover:bg-muted/30 transition-all rounded-lg font-medium">
                                        <SelectValue placeholder="Select a segment..."/>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-xl">
                                        {segments.map((s) => (
                                            <SelectItem key={s.id} value={s.id} className="font-medium cursor-pointer">
                                                {s.name} <span
                                                className="text-muted-foreground ml-2">({s.count} contacts)</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                </div>

                <div
                    className="bg-background border border-muted-foreground/20 shadow-xl shadow-primary/5 rounded-2xl p-6 space-y-6">
                    <div className="space-y-1.5">
                        <h3 className="font-black text-lg tracking-tight">Delivery Mode</h3>
                        <p className="text-sm text-muted-foreground font-medium">Choose when to dispatch this campaign
                            to your audience.</p>
                    </div>

                    <div className="space-y-4">
                        <Select value={sendMode} onValueChange={(v) => setSendMode(v as SendMode)}>
                            <SelectTrigger className="h-12 bg-muted/10 border-muted-foreground/20 font-bold rounded-xl">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl">
                                <SelectItem value="draft" className="font-bold cursor-pointer py-2">Keep as
                                    Draft</SelectItem>
                                <SelectItem value="now" className="font-bold cursor-pointer py-2 text-emerald-600">Send
                                    Now</SelectItem>
                                <SelectItem value="schedule" className="font-bold cursor-pointer py-2 text-primary">Schedule
                                    for Later</SelectItem>
                            </SelectContent>
                        </Select>

                        {sendMode === "schedule" && (
                            <div
                                className="space-y-1.5 p-4 bg-primary/5 border border-primary/10 rounded-xl animate-in fade-in zoom-in-95">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">Date &
                                    Time</Label>
                                <Input type="datetime-local" value={scheduledAt}
                                       onChange={(e) => setScheduledAt(e.target.value)}
                                       className="h-10 bg-background border-primary/20 focus-visible:ring-primary/20 font-mono font-bold rounded-lg shadow-sm"/>
                            </div>
                        )}
                    </div>

                    <div className="pt-2 border-t border-muted-foreground/10">
                        <div className="flex flex-col md:flex-row gap-3">
                            <Button className={cn(
                                "w-full md:w-2/3 h-12 rounded-xl font-black tracking-wide shadow-md transition-all active:scale-[0.98]",
                                sendMode === "draft" ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                                    type="submit" disabled={isPending}>
                                <HugeIcon name={buttonConfig[sendMode].icon as any} size={18} className="mr-2"/>
                                {isPending ? "Processing..." : buttonConfig[sendMode].text}
                            </Button>
                            <Button variant="outline" type="button" onClick={() => router.back()} disabled={isPending}
                                    className="w-full md:w-1/3 h-12 rounded-xl font-bold tracking-wide border-muted-foreground/20 hover:bg-muted/50 transition-all active:scale-[0.98]">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}