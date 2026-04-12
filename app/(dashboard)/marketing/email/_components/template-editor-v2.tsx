"use client";

import {useEffect, useRef, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import EmailEditor, {EditorRef, EmailEditorProps} from "react-email-editor";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Badge} from "@/components/ui/badge";
import {LayoutTemplate, Save, Send} from "lucide-react";
import {CAMPAIGN_STATUS} from "@/lib/enums";
import {toast} from "sonner";
import {useAppStore} from "@/lib/store/app-store";
import {createEmailTemplateV2, updateEmailTemplateV2} from "@/lib/actions/email-template";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";

type Props = {
    templateId?: string;
    defaultValues?: {
        name: string;
        subject: string;
        previewText: string;
        htmlBody: string;
        jsonBody?: any;
        status: typeof CAMPAIGN_STATUS.DRAFT | typeof CAMPAIGN_STATUS.PUBLISHED;
    };
};

export function TemplateEditorV2({templateId, defaultValues}: Props) {
    const router = useRouter();
    const setDynamicName = useAppStore((state) => state.setDynamicName);
    const [isPending, startTransition] = useTransition();

    // Prevent Next.js SSR hydration errors with Unlayer
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const emailEditorRef = useRef<EditorRef>(null);

    const [name, setName] = useState(defaultValues?.name ?? "New Template Name");
    const [subject, setSubject] = useState(defaultValues?.subject ?? "");
    const [previewText, setPreviewText] = useState(defaultValues?.previewText ?? "");
    const [status, setStatus] = useState<typeof CAMPAIGN_STATUS.DRAFT | typeof CAMPAIGN_STATUS.PUBLISHED>(
        defaultValues?.status ?? CAMPAIGN_STATUS.DRAFT
    );

    const [isDirty, setIsDirty] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    const isPublished = status === CAMPAIGN_STATUS.PUBLISHED;

    useEffect(() => {
        setDynamicName(name || "Untitled DND Template");
        return () => setDynamicName(null);
    }, [name, setDynamicName]);

    const onReady: EmailEditorProps['onReady'] = (unlayer) => {
        if (defaultValues?.jsonBody) {
            try {
                unlayer.loadDesign(defaultValues.jsonBody);
            } catch (err) {
                console.error("Failed to load design:", err);
                toast.error("Could not load previous layout.");
            }
        }

        unlayer.addEventListener('design:updated', () => {
            setIsDirty(true);
        });
    };

    function handleCancel() {
        if (isDirty)
            setShowCancelDialog(true);
        else
            router.push("/marketing/email?tab=templates");
    }

    const handleSave = (saveStatus: typeof CAMPAIGN_STATUS.DRAFT | typeof CAMPAIGN_STATUS.PUBLISHED) => {
        if (!name || !subject) {
            toast.error("Name and Subject are required.");
            return;
        }

        const unlayer = emailEditorRef.current?.editor;
        if (!unlayer)
            return;

        unlayer.exportHtml((data) => {
            const {design, html} = data;

            // Start the DB transition
            startTransition(async () => {
                try {
                    // Stringify the JSON object so it can be saved safely in a text column
                    const stringifiedDesign = JSON.stringify(design);

                    if (templateId) {
                        await updateEmailTemplateV2(templateId, {
                            name,
                            subject,
                            previewText,
                            htmlBody: html,
                            jsonBody: design,
                            status: saveStatus
                        });
                        setStatus(saveStatus);
                        setIsDirty(false);
                        toast.success(`Template ${saveStatus === CAMPAIGN_STATUS.PUBLISHED ? "published" : "saved"}.`);
                        router.refresh();
                    } else {
                        const id = await createEmailTemplateV2({
                            name,
                            subject,
                            previewText,
                            htmlBody: html,
                            jsonBody: design
                        });
                        setIsDirty(false);
                        toast.success("Template created successfully.");
                        router.push(`/marketing/email/templates/${id}`);
                    }
                } catch (err) {
                    toast.error("Failed to save template to database.");
                }
            });
        });
    };

    if (!mounted)
        return <div className="p-10 text-center animate-pulse">Loading Drag & Drop Builder...</div>;

    return (
        <>
            <div className="flex flex-col h-full border rounded-xl overflow-hidden bg-background shadow-sm">
                {/* 1. SETTINGS SECTION */}
                <div className="flex flex-col gap-3 p-5 border-b shrink-0 bg-muted/10">
                    <div className="flex items-center gap-2 pb-2">
                        <LayoutTemplate className="size-5 text-primary"/>
                        <h2 className="font-bold text-lg">Email Playground</h2>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                        <Label className="text-xs font-bold text-muted-foreground uppercase text-right">Template
                            Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setIsDirty(true);
                            }}
                            disabled={isPublished}
                            className="bg-background shadow-sm"/>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                        <Label className="text-xs font-bold text-muted-foreground uppercase text-right">Subject
                            Line</Label>
                        <Input
                            value={subject}
                            onChange={(e) => {
                                setSubject(e.target.value);
                                setIsDirty(true);
                            }}
                            disabled={isPublished}
                            className="bg-background shadow-sm"/>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                        <Label className="text-xs font-bold text-muted-foreground uppercase text-right">Preview
                            Snippet</Label>
                        <Input
                            value={previewText}
                            onChange={(e) => {
                                setPreviewText(e.target.value);
                                setIsDirty(true);
                            }}
                            disabled={isPublished}
                            placeholder="Optional inbox snippet..."
                            className="bg-background shadow-sm transition-all focus-visible:ring-primary/50"/>
                    </div>
                </div>

                {/* 2. UNLAYER CANVAS */}
                <div className="flex-1 w-full bg-muted/30 relative">
                    <EmailEditor
                        ref={emailEditorRef}
                        onReady={onReady}
                        style={{minHeight: '100%'}}
                        options={{
                            // You can customize Unlayer's theme and features here
                            appearance: {
                                theme: 'light',
                                panels: {tools: {dock: 'right'}}
                            }
                        }}
                    />
                </div>

                {/* 3. ACTIONS */}
                <div
                    className="flex items-center justify-between p-3 border-t bg-card shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 pr-4">
                    <span
                        className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status:</span>
                            <Badge variant={isPublished ? "default" : "secondary"}
                                   className="uppercase tracking-wider text-[10px]">
                                {status}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" className="font-bold text-muted-foreground hover:text-foreground"
                                onClick={handleCancel} disabled={isPending}>
                            Cancel
                        </Button>

                        {!isPublished ? (
                            <>
                                <Button variant="outline" className="font-bold shadow-sm"
                                        onClick={() => handleSave(CAMPAIGN_STATUS.DRAFT)} disabled={isPending}>
                                    <Save className="size-4 mr-2 text-muted-foreground"/> Save Draft
                                </Button>
                                <Button className="font-bold shadow-sm"
                                        onClick={() => handleSave(CAMPAIGN_STATUS.PUBLISHED)} disabled={isPending}>
                                    <Send className="size-4 mr-2"/> Publish Ready
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline" className="font-bold border-primary text-primary"
                                    onClick={() => handleSave(CAMPAIGN_STATUS.DRAFT)} disabled={isPending}>
                                <Save className="size-4 mr-2"/> Revert to Draft
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. If you leave this page, your recent edits will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Editing</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => router.push("/marketing/email?tab=templates")}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Discard & Leave
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}