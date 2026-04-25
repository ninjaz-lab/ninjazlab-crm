"use client";

import {useTransition} from "react";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {deleteProviderConfig} from "@/lib/actions/admin/providers";
import {ProviderConfig} from "./provider-dashboard";

interface Props {
    provider: ProviderConfig | null;
    onClose: () => void;
}

export function ProviderDeleteDialog({provider, onClose}: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    function handleDelete() {
        if (!provider) return;
        startTransition(async () => {
            try {
                await deleteProviderConfig(provider.id);
                toast.success("Provider configuration removed");
                router.refresh();
                onClose();
            } catch (err) {
                toast.error("Failed to delete provider");
            }
        });
    }

    return (
        <AlertDialog open={!!provider} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove API Configuration?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {provider?.userId
                            ? `This will remove the dedicated credentials for ${provider.userName}. Their future emails will instantly route through the System Global pool.`
                            : "WARNING: Removing the global fallback provider will cause all emails to fail unless another default is set."}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isPending}
                                       className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        {isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}