"use client";

import {useRef, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import * as XLSX from "xlsx";
import {createEmailCampaign} from "@/lib/actions/email-marketing";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {HugeIcon} from "@/components/huge-icon";
import {type RecipientRow, SendMode, useEmailCampaignStore} from "@/lib/store/email-campaign-store";
import {CAMPAIGN_STATUS} from "@/lib/enums";
import {cn} from "@/lib/utils/utils";

type Template = { id: string; name: string; subject: string | null; status: string };

function parseRecipientFile(file: File): Promise<RecipientRow[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb = XLSX.read(e.target?.result, {type: "array"});
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const raw = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {defval: ""});
                const rows = raw
                    .map((r) => ({
                        email: (r.email ?? r.Email ?? r.EMAIL ?? "").toString().trim(),
                        firstName: (r.firstName ?? r.first_name ?? r["First Name"] ?? r.FirstName ?? "").toString().trim() || undefined,
                        lastName: (r.lastName ?? r.last_name ?? r["Last Name"] ?? r.LastName ?? "").toString().trim() || undefined,
                    }))
                    .filter((r) => r.email.includes("@"));
                resolve(rows);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

export function NewCampaignForm({templates}: { templates: Template[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");
    const [isParsing, setIsParsing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        name, setName, fromName, setFromName, fromEmail, setFromEmail,
        replyTo, setReplyTo, templateId, setTemplateId,
        recipientRows, setRecipientRows,
        sendMode, setSendMode, scheduledAt, setScheduledAt,
        utmSource, setUtmSource, utmMedium, setUtmMedium, utmCampaign, setUtmCampaign,
        reset
    } = useEmailCampaignStore();

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsParsing(true);
        setError("");
        try {
            const rows = await parseRecipientFile(file);
            if (rows.length === 0) {
                setError("No valid email addresses found in the file. Ensure the file has an 'email' column.");
            } else {
                setRecipientRows(rows);
            }
        } catch {
            setError("Failed to parse file. Please upload a valid CSV or Excel file.");
        } finally {
            setIsParsing(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    function handleSubmit() {
        if (!name || !fromName || !fromEmail || !templateId) {
            setError("Name, from details, and template are required.");
            return;
        }
        if (recipientRows.length === 0) {
            setError("Please upload a recipient list (CSV or Excel).");
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
                recipientRows,
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
                            <h3 className="font-bold text-foreground leading-tight">Content & Recipients</h3>
                            <p className="text-xs text-muted-foreground font-medium">Select your template and upload
                                recipients</p>
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

                        {/* Recipients Upload */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Recipients
                            </Label>
                            {recipientRows.length > 0 ? (
                                <div
                                    className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <HugeIcon name="CheckmarkCircle01Icon" size={18}
                                                  className="text-emerald-600"/>
                                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                            {recipientRows.length} recipients loaded
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setRecipientRows([])}
                                            className="text-muted-foreground hover:text-destructive text-xs h-7">
                                        Clear
                                    </Button>
                                </div>
                            ) : (
                                <label
                                    className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all">
                                    <HugeIcon name={isParsing ? "Loading03Icon" : "Upload04Icon"} size={22}
                                              className={cn("text-muted-foreground mb-1.5", isParsing && "animate-spin")}/>
                                    <span className="text-sm font-semibold text-muted-foreground">
                                        {isParsing ? "Parsing file..." : "Click to upload CSV or Excel"}
                                    </span>
                                    <span className="text-xs text-muted-foreground/70 mt-0.5">
                                        Needs an <code className="font-mono">email</code> column. Optional: <code
                                        className="font-mono">firstName</code>, <code
                                        className="font-mono">lastName</code>
                                    </span>
                                    <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                                           onChange={handleFileChange} disabled={isParsing}/>
                                </label>
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
                                onClick={handleSubmit} disabled={isPending || isParsing}>
                            <HugeIcon name={buttonConfig[sendMode].icon as any} size={18} className="mr-2"/>
                            {isPending ? "Processing..." : buttonConfig[sendMode].text}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
