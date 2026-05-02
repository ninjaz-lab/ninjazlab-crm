"use client";

import {useRef, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import * as XLSX from "xlsx";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {HugeIcon} from "@/components/huge-icon";
import {updateEmailCampaign} from "@/lib/actions/email-marketing";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {CAMPAIGN_STATUS} from "@/lib/enums";
import {cn} from "@/lib/utils/utils";
import type {RecipientRow} from "@/lib/store/email-campaign-store";

type Template = { id: string; name: string; subject: string | null; status: string };
type SendMode = "draft" | "now" | "schedule";

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

export function EditCampaignForm({
                                     campaign,
                                     detail,
                                     templates = [],
                                 }: {
    campaign: any;
    detail: any;
    templates?: Template[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isParsing, setIsParsing] = useState(false);
    const [recipientRows, setRecipientRows] = useState<RecipientRow[] | null>(null); // null = keep existing
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [sendMode, setSendMode] = useState<SendMode>(
        campaign.status === CAMPAIGN_STATUS.SCHEDULED ? "schedule" : "draft"
    );
    const [scheduledAt, setScheduledAt] = useState<string>(
        campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : ""
    );

    const publishedTemplates = templates.filter((t) => t.status === CAMPAIGN_STATUS.PUBLISHED);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsParsing(true);
        try {
            const rows = await parseRecipientFile(file);
            if (rows.length === 0) {
                toast.error("No valid email addresses found. Ensure the file has an 'email' column.");
            } else {
                setRecipientRows(rows);
            }
        } catch {
            toast.error("Failed to parse file. Please upload a valid CSV or Excel file.");
        } finally {
            setIsParsing(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    async function onSubmit(formData: FormData) {
        if (sendMode === "schedule" && !scheduledAt) {
            toast.error("Please select a date and time to schedule the campaign.");
            return;
        }

        formData.append("sendMode", sendMode);
        if (scheduledAt) formData.append("scheduledAt", scheduledAt);
        // null = keep existing list; only send rows when a new file was uploaded
        if (recipientRows !== null) {
            formData.append("recipientRowsJson", JSON.stringify(recipientRows));
        }

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

            {/* RIGHT COLUMN: Content & Actions */}
            <div className="space-y-8">
                {/* 2. Content & Recipients */}
                <div className="bg-background border border-muted-foreground/20 shadow-sm rounded-xl overflow-hidden">
                    <div className="bg-muted/30 border-b border-muted-foreground/10 px-6 py-4 flex items-center gap-3">
                        <div className="p-2 bg-background rounded-lg shadow-sm border border-muted-foreground/10">
                            <HugeIcon name="UserMultiple01Icon" size={16} className="text-primary"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground leading-tight">Content & Recipients</h3>
                            <p className="text-xs text-muted-foreground font-medium">Update the template and upload a
                                new recipient list</p>
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

                        {/* Recipients Upload */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Recipients
                            </Label>
                            {recipientRows !== null ? (
                                // New file uploaded
                                <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <HugeIcon name="CheckmarkCircle01Icon" size={18} className="text-emerald-600"/>
                                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                            {recipientRows.length} new recipients loaded
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="sm" type="button"
                                            onClick={() => setRecipientRows(null)}
                                            className="text-muted-foreground hover:text-destructive text-xs h-7">
                                        Cancel
                                    </Button>
                                </div>
                            ) : campaign.totalRecipients > 0 ? (
                                // Keeping existing list
                                <div className="flex items-center justify-between p-4 bg-muted/20 border border-muted-foreground/20 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <HugeIcon name="UserMultiple02Icon" size={18} className="text-muted-foreground"/>
                                        <span className="text-sm font-medium text-muted-foreground">
                                            Keeping existing list ({campaign.totalRecipients} recipients)
                                        </span>
                                    </div>
                                    <label className="cursor-pointer text-xs font-bold text-primary hover:underline">
                                        Replace
                                        <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls"
                                               className="hidden" onChange={handleFileChange} disabled={isParsing}/>
                                    </label>
                                </div>
                            ) : (
                                // No existing list — must upload
                                <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all">
                                    <HugeIcon name={isParsing ? "Loading03Icon" : "Upload04Icon"} size={22}
                                              className={cn("text-muted-foreground mb-1.5", isParsing && "animate-spin")}/>
                                    <span className="text-sm font-semibold text-muted-foreground">
                                        {isParsing ? "Parsing file..." : "Click to upload CSV or Excel"}
                                    </span>
                                    <span className="text-xs text-muted-foreground/70 mt-0.5">
                                        Needs an <code className="font-mono">email</code> column. Optional: <code className="font-mono">firstName</code>, <code className="font-mono">lastName</code>
                                    </span>
                                    <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                                           onChange={handleFileChange} disabled={isParsing}/>
                                </label>
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
                                    type="submit" disabled={isPending || isParsing}>
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
