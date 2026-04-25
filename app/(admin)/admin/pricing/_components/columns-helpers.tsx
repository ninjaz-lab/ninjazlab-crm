import {Button} from "@/components/ui/button";
import {HugeIcon} from "@/components/huge-icon";
import {cn} from "@/lib/utils/utils";
import {JSX} from "react";

export function formatPricingAmount(price: string | number): string {
    const num = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(num)) return "0.00";
    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
    }).format(num);
}

export function SortHeader({column, label}: { column: any; label: string }): JSX.Element {
    const isSorted = column.getIsSorted();
    return (
        <Button variant="ghost"
                onClick={() => column.toggleSorting(isSorted === "asc")}
                className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                data-active={!!isSorted}>
            {label}
            <HugeIcon
                name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                size={14}
                className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
        </Button>
    );
}
