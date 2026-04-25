"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {createEmailCampaign} from "@/lib/actions/email-marketing";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {HugeIcon} from "@/components/huge-icon";
import {SendMode, useEmailCampaignStore} from "@/lib/store/email-campaign-store";
import {CAMPAIGN_STATUS} from "@/lib/enums";
import {cn} from "@/lib/utils/utils";

type Template = { id: string; name: string; subject: string | null; status: string };
type Segment = { id: string; name: string; count: number };

export function NewCampaignForm(
    {
        templates,
        segments,
    }: {
        templates: Template[];
        segments: Segment[];
    }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");

    const {
        name, setName, fromName, setFromName, fromEmail, setFromEmail,
        replyTo, setReplyTo, templateId, setTemplateId, listId, setListId,
        sendMode, setSendMode, scheduledAt, setScheduledAt,
        utmSource, setUtmSource, utmMedium, setUtmMedium, utmCampaign, setUtmCampaign,
        reset
    } = useEmailCampaignStore();

    function handleSubmit() {
        if (!name || !fromName || !fromEmail || !templateId || !listId) {
            setError("Name, from details, template and segment are required.");
            return;
        }
        if (sendMode === "schedule" && !scheduledAt) {
            setError("Please select a date and time to schedule the campaign.");
            return;
        }
        setError("");

        startTransition(async () => {
            const id = await createEmailCampaign({
                name,
                fromName,
                fromEmail,
                replyTo: replyTo || undefined,
                templateId,
                listId,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
                utmSource: utmSource || undefined,
                utmMedium: utmMedium || undefined,
                utmCampaign: utmCampaign || undefined,
            });
            reset();
            router.push(`/email/campaigns/${id}`);
        });
    }

    const publishedTemplates = templates.filter((t) => t.status === CAMPAIGN_STATUS.PUBLISHED);

    const buttonConfig = {
        draft: {text: "Save as Draft", icon: "PencilEdit01Icon"},
        now: {text: "Send Now", icon: "SentIcon"},
        schedule: {text: "Schedule Campaign", icon: "Calendar04Icon"}
    };

    return (
        <div className="grid gap-8 lg:grid-cols-2 items-start w-full">

            {/* LEFT COLUMN: Configuration & Tracking */}
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
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Campaign
                                Name</Label>
                            <Input
                                className="h-10 bg-muted/10 hover:bg-muted/30 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-lg"
                                placeholder="e.g. Q3 Product Launch" value={name}
                                onChange={(e) => setName(e.target.value)}/>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label
                                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">From
                                    Name</Label>
                                <Input
                                    className="h-10 bg-muted/10 hover:bg-muted/30 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-lg"
                                    placeholder="Your Company" value={fromName}
                                    onChange={(e) => setFromName(e.target.value)}/>
                            </div>
                            <div className="space-y-1.5">
                                <Label
                                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">From
                                    Email</Label>
                                <Input
                                    className="h-10 bg-muted/10 hover:bg-muted/30 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-lg"
                                    type="email" placeholder="hello@yourdomain.com" value={fromEmail}
                                    onChange={(e) => setFromEmail(e.target.value)}/>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reply-To
                                (optional)</Label>
                            <Input
                                className="h-10 bg-muted/10 hover:bg-muted/30 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-lg"
                                type="email" placeholder="support@yourdomain.com" value={replyTo}
                                onChange={(e) => setReplyTo(e.target.value)}/>
                        </div>
                    </div>
                </div>

                {/* 3. UTM Tracking (Moved to left column to balance height) */}
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
                            <Label
                                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Source</Label>
                            <Input
                                className="h-10 bg-muted/10 hover:bg-muted/30 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-lg"
                                value={utmSource} onChange={(e) => setUtmSource(e.target.value)}
                                placeholder="newsletter"/>
                        </div>
                        <div className="space-y-1.5">
                            <Label
                                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Medium</Label>
                            <Input
                                className="h-10 bg-muted/10 hover:bg-muted/30 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-lg"
                                value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="email"/>
                        </div>
                        <div className="space-y-1.5">
                            <Label
                                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Campaign</Label>
                            <Input
                                className="h-10 bg-muted/10 hover:bg-muted/30 focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-lg"
                                value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)}
                                placeholder="q3_launch"/>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Content, Audience & Actions */}
            <div className="space-y-8">
                {/* 2. Content & Audience */}
                <div className="bg-background border border-muted-foreground/20 shadow-sm rounded-xl overflow-hidden">
                    <div className="bg-muted/30 border-b border-muted-foreground/10 px-6 py-4 flex items-center gap-3">
                        <div className="p-2 bg-background rounded-lg shadow-sm border border-muted-foreground/10">
                            <HugeIcon name="UserMultiple01Icon" size={16} className="text-primary"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground leading-tight">Content & Audience</h3>
                            <p className="text-xs text-muted-foreground font-medium">Select your target segment and
                                design</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Design
                                Template</Label>
                            {publishedTemplates.length === 0 ? (
                                <Alert className="bg-muted/20 border-primary/20 text-primary">
                                    <HugeIcon name="Alert01Icon" size={16}/>
                                    <AlertDescription className="ml-2 font-medium">No published templates found. Create
                                        one first.</AlertDescription>
                                </Alert>
                            ) : (
                                <Select value={templateId} onValueChange={setTemplateId}>
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
                                    <AlertDescription className="ml-2 font-medium">No segments yet. Go to Audience to
                                        create one.</AlertDescription>
                                </Alert>
                            ) : (
                                <Select value={listId} onValueChange={setListId}>
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

                {/* Delivery Mode Card */}
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
                        {error && <p className="text-sm text-destructive font-bold mb-4">{error}</p>}
                        <Button className={cn(
                            "w-full h-12 rounded-xl font-black tracking-wide shadow-md transition-all active:scale-[0.98]",
                            sendMode === "draft" ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                                onClick={handleSubmit} disabled={isPending}>
                            <HugeIcon name={buttonConfig[sendMode].icon as any} size={18} className="mr-2"/>
                            {isPending ? "Processing..." : buttonConfig[sendMode].text}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}