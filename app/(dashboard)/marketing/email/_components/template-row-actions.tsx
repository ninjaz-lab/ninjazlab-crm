"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Copy, Eye, Pencil, Trash2} from "lucide-react";
import {toast} from "sonner";
import {deleteEmailTemplate} from "@/lib/actions/email-template";
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
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";

export function TemplateRowActions({templateId, htmlBody}: { templateId: string, htmlBody: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    function handleClone() {
        toast.info("Template cloned!");
        router.push(`/marketing/email/templates/new?cloneFrom=${templateId}`);
    }

    function handleDelete() {
        startTransition(async () => {
            try {
                await deleteEmailTemplate(templateId);
                toast.success("Template deleted.");
                setDeleteOpen(false);
                router.refresh();
            } catch (err) {
                toast.error("Failed to delete template.");
            }
        });
    }

    return (
        <>
            <TooltipProvider delayDuration={100}>
                <div className="flex items-center justify-end gap-1">

                    {/* 1. Straight Preview */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                                onClick={() => setPreviewOpen(true)}
                            >
                                <Eye className="size-4"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-foreground text-background font-medium text-xs">
                            <p>Preview</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* 2. Clone */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-orange-500 hover:bg-emerald-500/10 transition-colors"
                                onClick={handleClone}
                            >
                                <Copy className="size-4"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-foreground text-background font-medium text-xs">
                            <p>Clone</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* 3. Edit */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-yellow-500 hover:bg-purple-500/10 transition-colors"
                                asChild
                            >
                                <Link href={`/marketing/email/templates/${templateId}`}>
                                    <Pencil className="size-4"/>
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-foreground text-background font-medium text-xs">
                            <p>Edit</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* 4. Delete */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                onClick={() => setDeleteOpen(true)}
                                disabled={isPending}
                            >
                                <Trash2 className="size-4"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent
                            className="bg-foreground text-background font-medium text-xs">
                            <p>Delete</p>
                        </TooltipContent>
                    </Tooltip>

                </div>
            </TooltipProvider>

            {/* Straight Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 border-b shrink-0 bg-muted/20">
                        <DialogTitle className="text-lg">Template Preview</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 bg-white relative">
                        <iframe
                            srcDoc={htmlBody || "<p style='text-align:center; margin-top:50px; font-family:sans-serif;'>No HTML available.</p>"}
                            className="absolute inset-0 w-full h-full border-none"
                            sandbox="allow-same-origin"
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete template?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this template. You cannot undo this action.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
                        >
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}