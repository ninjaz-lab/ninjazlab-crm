import {format, isValid} from "date-fns";
import {ColumnDef} from "@tanstack/react-table";
import {Button} from "@/components/ui/button";
import {HugeIcon} from "@/components/huge-icon";
import {cn} from "@/lib/utils/utils";

export function createDateColumn<TData>(
    accessorKey: Extract<keyof TData, string>,
    label: string
): ColumnDef<TData, any> {
    return {
        accessorKey,
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button variant="ghost"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                        className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                        data-active={!!isSorted}
                >
                    {label}
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}
                    />
                </Button>
            );
        },
        cell: ({row}) => {
            const dateVal = row.getValue(accessorKey) as string | Date | null | undefined;

            if (!dateVal)
                return <span className="text-xs font-medium text-muted-foreground">-</span>;

            return (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">{formatDate(dateVal)}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{formatTime(dateVal)}</span>
                </div>
            );
        },
    };
}

function formatDate(date: Date | string | null | undefined): string {
    if (!date) return "-";
    const parsedDate = typeof date === "string"
        ? new Date(date)
        : date;
    if (!isValid(parsedDate)) return "-";
    return format(parsedDate, "MMM dd, yyyy");
}

function formatTime(date: Date | string | null | undefined): string {
    if (!date) return "-";
    const parsedDate = typeof date === "string"
        ? new Date(date)
        : date;
    if (!isValid(parsedDate)) return "-";
    return format(parsedDate, "hh:mm:ss a");
}

export function formatDateTime(date: Date | string | null) {
    if (!date) return "—";
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(date));
}
