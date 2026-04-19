import {TRANSACTION_TYPES} from "@/lib/enums";

export function formatAmount(amount: number | string): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;

    // Fallback in case of invalid input
    if (isNaN(num))
        return "0.00";

    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
}

export function fetchAmountColor(type: string): string {
    return type === TRANSACTION_TYPES.CREDIT
        ? "text-emerald-600"
        : "text-rose-600";
}