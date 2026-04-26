import {useMemo, useState, useTransition} from "react";
import {toast} from "sonner";
import {requestTopUp} from "@/lib/actions/billing";

interface UseUserBillingDashboardProps {
    transactions: any[];
}

export function useUserBillingDashboard({transactions}: UseUserBillingDashboardProps) {
    const [activeTab, setActiveTab] = useState("transactions");
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState<string>("50");
    const [receipt, setReceipt] = useState<File | null>(null);
    const [isPending, startTransition] = useTransition();

    const invoicesOnly = useMemo(() => {
        return transactions.filter(t => Boolean(t.invoiceUrl));
    }, [transactions]);

    const handleCopy = (text: string | undefined) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success("Account number copied to clipboard!");
    };

    const handleSubmit = () => {
        const amount = parseFloat(topUpAmount);
        if (isNaN(amount) || amount < 10) {
            toast.error("Minimum top-up amount is MYR 10.00");
            return;
        }

        if (!receipt) {
            toast.error("Please upload your bank transfer receipt.");
            return;
        }

        const maxMb = parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || "5", 10);
        const MAX_FILE_SIZE = maxMb * 1024 * 1024;
        if (receipt.size > MAX_FILE_SIZE) {
            toast.error("File is too large. Please upload a receipt under 5MB.");
            return;
        }

        const formData = new FormData();
        formData.append("amount", topUpAmount);
        formData.append("receipt", receipt);

        startTransition(async () => {
            try {
                await requestTopUp(formData);
                setIsTopUpOpen(false);
                setReceipt(null);
                toast.success("Receipt submitted! Your balance will be updated once an admin approves it.");
            } catch (error: any) {
                toast.error(error.message || "Failed to submit top-up request.");
            }
        });
    };

    const handleCloseDialog = () => {
        setIsTopUpOpen(false);
        setReceipt(null);
    };

    return {
        activeTab,
        setActiveTab,
        isTopUpOpen,
        setIsTopUpOpen,
        topUpAmount,
        setTopUpAmount,
        receipt,
        setReceipt,
        isPending,
        invoicesOnly,
        handleCopy,
        handleSubmit,
        handleCloseDialog,
    };
}
