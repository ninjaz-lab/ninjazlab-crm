"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {createEmailCampaign} from "@/lib/actions/email-marketing";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {CalendarClock, Clock, FileEdit, Info, Send} from "lucide-react";
import {SendMode, useEmailCampaignStore} from "@/lib/store/email-campaign-store";

type Template = { id: string; name: string; subject: string | null; status: string };
type Segment = { id: string; name: string; count: number };

export function CampaignForm({
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
        name, setName,
        fromName, setFromName,
        fromEmail, setFromEmail,
        replyTo, setReplyTo,
        templateId, setTemplateId,
        listId, setListId,
        sendMode, setSendMode,
        scheduledAt, setScheduledAt,
        utmSource, setUtmSource,
        utmMedium, setUtmMedium,
        utmCampaign, setUtmCampaign,
        reset
    } = useEmailCampaignStore();

    function handleSubmit() {
        // 1. Basic Validation
        if (!name || !fromName || !fromEmail || !templateId || !listId) {
            setError("Name, from details, template and segment are required.");
            return;
        }

        // 2. Schedule Validation
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

            reset(); // Clear store data on success
            router.push(`/marketing/email/campaigns/${id}`);
        });
    }

    const publishedTemplates = templates.filter((t) => t.status === "published");

    // Dynamic button text and icon based on the selected mode
    const buttonConfig = {
        draft: {text: "Save as Draft", icon: <FileEdit className="size-4"/>},
        now: {text: "Send Now", icon: <Send className="size-4"/>},
        schedule: {text: "Schedule Campaign", icon: <Clock className="size-4"/>}
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
                {/* Basic info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Campaign Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Campaign Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. April Newsletter"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="fromName">From Name</Label>
                                <Input
                                    id="fromName"
                                    placeholder="NinjazCRM"
                                    value={fromName}
                                    onChange={(e) => setFromName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fromEmail">From Email</Label>
                                <Input
                                    id="fromEmail"
                                    type="email"
                                    placeholder="hello@yourdomain.com"
                                    value={fromEmail}
                                    onChange={(e) => setFromEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="replyTo">Reply-To (optional)</Label>
                            <Input
                                id="replyTo"
                                type="email"
                                placeholder="support@yourdomain.com"
                                value={replyTo}
                                onChange={(e) => setReplyTo(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Template, Audience */}
                <Card>
                    <CardHeader>
                        <CardTitle>Content & Audience</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        {/* Template */}
                        <div className="space-y-2">
                            <Label>Template</Label>
                            {publishedTemplates.length === 0 ? (
                                <Alert>
                                    <Info className="size-4"/>
                                    <AlertDescription>
                                        No published templates. Create and publish a template first.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Select value={templateId} onValueChange={setTemplateId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a template..."/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {publishedTemplates.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.name} — {t.subject}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Audience */}
                        <div className="space-y-2">
                            <Label>Audience Segment</Label>
                            {segments.length === 0 ? (
                                <Alert>
                                    <Info className="size-4"/>
                                    <AlertDescription>
                                        No segments yet. Go to Audience and create a segment first.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Select value={listId} onValueChange={setListId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a segment..."/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {segments.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name} ({s.count} contacts)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* UTM */}
                <Card>
                    <CardHeader>
                        <CardTitle>UTM Tracking (optional)</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>UTM Source</Label>
                            <Input value={utmSource} onChange={(e) => setUtmSource(e.target.value)}
                                   placeholder="email"/>
                        </div>
                        <div className="space-y-2">
                            <Label>UTM Medium</Label>
                            <Input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)}
                                   placeholder="newsletter"/>
                        </div>
                        <div className="space-y-2">
                            <Label>UTM Campaign</Label>
                            <Input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)}
                                   placeholder="april-2026"/>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sidebar: Delivery + submit */}
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarClock className="size-4"/>
                            Delivery
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>When should this be sent?</Label>
                            <Select value={sendMode} onValueChange={(v) => setSendMode(v as SendMode)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Keep as Draft</SelectItem>
                                    <SelectItem value="now">Send Now</SelectItem>
                                    <SelectItem value="schedule">Schedule for Later</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Conditionally render the date picker only if they choose "schedule" */}
                        {sendMode === "schedule" && (
                            <div className="space-y-2 pt-2 border-t">
                                <Label htmlFor="scheduledAt">Select Date & Time</Label>
                                <Input
                                    id="scheduledAt"
                                    type="datetime-local"
                                    value={scheduledAt}
                                    onChange={(e) => setScheduledAt(e.target.value)}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 space-y-3">
                        {error && <p className="text-sm text-destructive font-medium">{error}</p>}

                        <Button
                            className="w-full flex items-center gap-2"
                            onClick={handleSubmit}
                            disabled={isPending}
                            variant={sendMode === "draft" ? "secondary" : "default"}
                        >
                            {buttonConfig[sendMode].icon}
                            {buttonConfig[sendMode].text}
                        </Button>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
