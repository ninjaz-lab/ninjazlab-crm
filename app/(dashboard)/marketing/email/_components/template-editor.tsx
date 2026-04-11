"use client";

import {useEffect, useRef, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {createEmailTemplate, deleteEmailTemplate, updateEmailTemplate} from "@/lib/actions/email-template";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {Badge} from "@/components/ui/badge";
import {ClipboardPlus, Code, Copy, Eye, Monitor, Save, Send, Smartphone, Trash2} from "lucide-react";
import {CAMPAIGN_STATUS} from "@/lib/enums";
import {toast} from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {cn} from "@/lib/utils";
import {useAppStore} from "@/lib/store/app-store";

const STARTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: sans-serif; padding: 20px; background: #f4f4f5; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
    .spacer { height: 800px; background: repeating-linear-gradient(45deg, #fafafa, #fafafa 10px, #f4f4f5 10px, #f4f4f5 20px); margin-top: 20px; border-radius: 8px;}
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello {{firstName}},</h1>
    <p>Start writing your email here!</p>
    <div class="spacer"></div>
    <p>Bottom of the email.</p>
  </div>
</body>
</html>`;

const AVAILABLE_VARIABLES = [
    {label: "First Name", tag: "{{firstName}}"},
    {label: "Last Name", tag: "{{lastName}}"},
    {label: "Email", tag: "{{email}}"},
];

type Props = {
    templateId?: string;
    defaultValues?: {
        name: string;
        subject: string;
        previewText: string;
        htmlBody: string;
        status: typeof CAMPAIGN_STATUS.DRAFT | typeof CAMPAIGN_STATUS.PUBLISHED;
    };
};

export function TemplateEditor({templateId, defaultValues}: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [name, setName] = useState(defaultValues?.name ?? "");
    const [subject, setSubject] = useState(defaultValues?.subject ?? "");
    const [previewText, setPreviewText] = useState(defaultValues?.previewText ?? "");
    const [htmlBody, setHtmlBody] = useState(defaultValues?.htmlBody ?? STARTER_HTML);
    const [status, setStatus] = useState<typeof CAMPAIGN_STATUS.DRAFT | typeof CAMPAIGN_STATUS.PUBLISHED>(
        defaultValues?.status ?? CAMPAIGN_STATUS.DRAFT
    );
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

    const isPublished = status === CAMPAIGN_STATUS.PUBLISHED;

    const setDynamicName = useAppStore((state) => state.setDynamicName);
    useEffect(() => {
        if (templateId)
            setDynamicName(name || "Untitled Template");
        else
            setDynamicName(null);

        // Cleanup: clear the header when they leave the editor page
        return () => setDynamicName(null);
    }, [templateId, name, setDynamicName]);

    // ─── SCROLL SYNC ENGINE ───────────────────────────────────────────────────
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const scrollLockRef = useRef<"textarea" | "iframe" | null>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const setScrollLock = (source: "textarea" | "iframe") => {
        scrollLockRef.current = source;
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
            scrollLockRef.current = null;
        }, 100);
    };

    const handleTextareaScroll = () => {
        if (scrollLockRef.current === "iframe") return;
        setScrollLock("textarea");

        const ta = textareaRef.current;
        const iframeWindow = iframeRef.current?.contentWindow;
        if (!ta || !iframeWindow)
            return;

        const taScrollable = ta.scrollHeight - ta.clientHeight;
        if (taScrollable <= 0)
            return;

        const percentage = ta.scrollTop / taScrollable;
        const iframeDoc = iframeWindow.document;
        const iframeScrollable = iframeDoc.documentElement.scrollHeight - iframeWindow.innerHeight;

        iframeWindow.scrollTo(0, percentage * iframeScrollable);
    };

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data?.type === 'IFRAME_SCROLL') {
                if (scrollLockRef.current === "textarea") return;
                setScrollLock("iframe");

                const ta = textareaRef.current;
                if (!ta) return;

                const percentage = e.data.percentage;
                const taScrollable = ta.scrollHeight - ta.clientHeight;
                ta.scrollTop = percentage * taScrollable;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const trackingScript = `
        <script>
            window.addEventListener('scroll', () => {
                const scrollable = document.documentElement.scrollHeight - window.innerHeight;
                const percentage = scrollable > 0 ? window.scrollY / scrollable : 0;
                window.parent.postMessage({ type: 'IFRAME_SCROLL', percentage }, '*');
            });
        </script>
    `;
    const previewHtml = htmlBody ? htmlBody + trackingScript : "<div style='color:#888; text-align:center; padding: 40px; font-family:sans-serif;'>No HTML available.</div>";

    // ──────────────────────────────────────────────────────────────────────────

    function handleSave(saveStatus: typeof CAMPAIGN_STATUS.DRAFT | typeof CAMPAIGN_STATUS.PUBLISHED) {
        if (!name || !subject || !htmlBody) {
            toast.error("Name, Subject, and HTML Body are required.");
            return;
        }
        startTransition(async () => {
            try {
                if (templateId) {
                    await updateEmailTemplate(templateId, {name, subject, previewText, htmlBody, status: saveStatus});
                    setStatus(saveStatus);
                    toast.success(`Template ${saveStatus === CAMPAIGN_STATUS.PUBLISHED ? "published" : "saved"}.`);
                    router.refresh();
                } else {
                    const id = await createEmailTemplate({name, subject, previewText, htmlBody});
                    toast.success("Template created successfully.");
                    router.push(`/marketing/email/templates/${id}`);
                }
            } catch (err) {
                toast.error("Failed to save template.");
            }
        });
    }

    function handleClone() {
        if (!templateId)
            return;
        toast.info("Template cloned! Unsaved draft loaded.");
        router.push(`/marketing/email/templates/new?cloneFrom=${templateId}`);
    }

    function handleDelete() {
        if (!templateId)
            return;
        startTransition(async () => {
            try {
                await deleteEmailTemplate(templateId);
                toast.success("Template deleted.");
                router.push("/marketing/email/templates");
            } catch (err) {
                toast.error("Failed to delete template.");
            }
        });
    }

    function copyVariable(tag: string) {
        navigator.clipboard.writeText(tag);
        toast.success(`Copied ${tag} to clipboard!`);
    }

    return (
        <div
            className="flex flex-col h-[calc(100vh-140px)] min-h-[700px] border rounded-xl overflow-hidden bg-background shadow-sm">

            {/* 1. CLEAN SETTINGS SECTION (Top) */}
            <div className="flex flex-col gap-3 p-5 border-b shrink-0 bg-muted/10">
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <Label className="text-xs font-bold text-muted-foreground uppercase text-right">
                        Template Name
                    </Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isPublished}
                           placeholder="e.g. Welcome Email"
                           className="bg-background shadow-sm transition-all focus-visible:ring-primary/50"/>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <Label className="text-xs font-bold text-muted-foreground uppercase text-right">Subject Line</Label>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={isPublished}
                           placeholder="External subject..."
                           className="bg-background shadow-sm transition-all focus-visible:ring-primary/50"/>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <Label className="text-xs font-bold text-muted-foreground uppercase text-right">Preview
                        Snippet</Label>
                    <Input value={previewText} onChange={(e) => setPreviewText(e.target.value)} disabled={isPublished}
                           placeholder="Optional inbox snippet..."
                           className="bg-background shadow-sm transition-all focus-visible:ring-primary/50"/>
                </div>
            </div>

            {/* 2. SPLIT PANE EDITOR (Middle) */}
            <div className="flex-1 flex min-h-0 bg-background">

                {/* Left Pane: Code Editor */}
                <div className="w-1/2 flex flex-col border-r">
                    {/* 🚩 FIXED: Added strict h-12 and px-4 for perfect height alignment */}
                    <div className="flex items-center justify-between px-4 h-12 border-b bg-muted/20 shrink-0">
                        <span className="text-sm font-bold flex items-center gap-2">
                            <Code className="size-4"/> HTML Code
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span
                                className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Variables:</span>
                            {AVAILABLE_VARIABLES.map(v => (
                                <Button key={v.tag} variant="secondary" size="sm"
                                        className="h-6 text-[11px] font-mono hover:bg-primary/20 hover:text-primary transition-colors shadow-sm"
                                        onClick={() => copyVariable(v.tag)} title={`Copy ${v.label}`}>
                                    <ClipboardPlus className="size-3 mr-1 opacity-50"/> {v.tag}
                                </Button>
                            ))}
                        </div>
                    </div>
                    {/* Editor */}
                    <div className="flex-1 relative bg-[#1e1e1e]">
                        <Textarea
                            ref={textareaRef}
                            onScroll={handleTextareaScroll}
                            value={htmlBody}
                            onChange={(e) => setHtmlBody(e.target.value)}
                            disabled={isPublished}
                            className="absolute inset-0 w-full h-full font-mono text-[13px] leading-relaxed resize-none bg-transparent text-[#d4d4d4] border-none focus-visible:ring-0 p-4 rounded-none disabled:opacity-80"
                            placeholder="Paste your HTML here..."
                            spellCheck={false}
                        />
                    </div>
                </div>

                {/* Right Pane: Live Preview */}
                <div className="w-1/2 flex flex-col bg-muted/10">
                    {/* 🚩 FIXED: Added strict h-12 and px-4 for perfect height alignment */}
                    <div className="flex items-center justify-between px-4 h-12 border-b bg-muted/20 shrink-0">
                        <span className="text-sm font-bold flex items-center gap-2">
                            <Eye className="size-4"/> Live Preview
                        </span>
                        <div className="flex items-center gap-1 bg-background p-1 rounded-md border shadow-sm h-8">
                            <button onClick={() => setPreviewMode("desktop")}
                                    className={cn("p-1.5 rounded-sm transition-all", previewMode === "desktop" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
                                    title="Desktop View">
                                <Monitor className="size-3.5"/>
                            </button>
                            <button onClick={() => setPreviewMode("mobile")}
                                    className={cn("p-1.5 rounded-sm transition-all", previewMode === "mobile" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
                                    title="Mobile View">
                                <Smartphone className="size-3.5"/>
                            </button>
                        </div>
                    </div>
                    {/* Canvas */}
                    <div className="flex-1 relative flex justify-center items-start overflow-hidden bg-muted/30">
                        <div className={cn(
                            "bg-white transition-all duration-300 ease-in-out relative h-full flex flex-col shadow-2xl",
                            previewMode === "desktop" ? "w-full" : "w-[375px] border-x border-muted-foreground/20"
                        )}>
                            <iframe
                                ref={iframeRef}
                                srcDoc={previewHtml}
                                className="flex-1 w-full border-none"
                                title="Email Preview"
                                sandbox="allow-same-origin allow-scripts"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. STICKY FOOTER ACTIONS (Bottom) */}
            <div
                className="flex items-center justify-between p-3 border-t bg-card shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                <div className="flex items-center gap-4">
                    {/* Status & Secondary Actions */}
                    <div className="flex items-center gap-2 pr-4 border-r">
                        <span
                            className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status:</span>
                        <Badge variant={isPublished ? "default" : "secondary"}
                               className="uppercase tracking-wider text-[10px]">
                            {status}
                        </Badge>
                    </div>

                    {templateId && (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8" onClick={handleClone}
                                    disabled={isPending}>
                                <Copy className="size-3.5 mr-2 text-muted-foreground"/> Clone
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm"
                                            className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            disabled={isPending}>
                                        <Trash2 className="size-3.5 mr-2"/> Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete this template?</AlertDialogTitle>
                                        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete}
                                                           className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </div>

                {/* Primary Save Actions */}
                <div className="flex items-center gap-2">
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
    );
}