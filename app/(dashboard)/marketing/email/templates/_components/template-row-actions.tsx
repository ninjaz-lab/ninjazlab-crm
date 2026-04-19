"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
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
import {DataTableActions} from "@/components/data-table-actions";

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
            <DataTableActions
                actions={[
                    {
                        label: "Preview",
                        icon: "ViewIcon",
                        onClick: () => setPreviewOpen(true),
                    },
                    {
                        label: "Clone",
                        icon: "Copy01Icon",
                        onClick: handleClone,
                    },
                    {
                        label: "Edit",
                        icon: "Edit02Icon",
                        onClick: () => router.push(`/marketing/email/templates/${templateId}`),
                    },
                    {
                        label: "Delete",
                        icon: "Delete02Icon",
                        variant: "destructive",
                        onClick: () => setDeleteOpen(true),
                        disabled: isPending
                    }
                ]}
            />

            {/* Straight Preview Dialog (Kept exactly the same) */}
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

            {/* Delete Confirmation (Kept exactly the same) */}
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
                            disabled={isPending}
                        >
                            {isPending ? "Deleting..." : "Yes, Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}