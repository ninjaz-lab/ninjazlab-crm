"use client";

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
import {Rule} from "./pricing-dashboard";

interface Props {
    rule: Rule | null;
    onClose: () => void;
    onConfirm: () => void;
}

export function PricingDeleteDialog({rule, onClose, onConfirm}: Props) {
    return (
        <AlertDialog open={!!rule} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete this pricing rule?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {rule?.userId
                            ? `This will remove the custom rate for ${rule.userName}. They will fall back to the default pricing.`
                            : "This will remove this default rate. Users without a custom override will no longer be charged for this campaign."}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}
                                       className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold">
                        Confirm Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
