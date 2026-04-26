import {ColumnDef} from "@tanstack/react-table";
import {Button} from "@/components/ui/button";
import {HugeIcon} from "@/components/huge-icon";
import {cn} from "@/lib/utils/utils";
import Link from "next/link";
import {Badge} from "@/components/ui/badge";
import {CAMPAIGN_STATUS} from "@/lib/enums";
import {TableRowAction, TableRowActions} from "@/components/data-table/table-row-actions";
import {generateDateColumn} from "@/lib/utils/date";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "secondary",
    scheduled: "outline",
    sending: "default",
    sent: "default",
    paused: "secondary",
    cancelled: "destructive",
    published: "default",
};

const ActionCell = ({row}: { row: any }) => {
    const campaign = row.original;
    const isEditable = campaign.status === CAMPAIGN_STATUS.DRAFT || campaign.status === CAMPAIGN_STATUS.SCHEDULED;

    const actions: TableRowAction[] = [
        {
            label: "View",
            icon: "ViewIcon",
            href: `/email/campaigns/${campaign.id}`,
        },
        {
            label: "Edit",
            icon: "Edit02Icon",
            href: `/email/campaigns/${campaign.id}/edit`,
            hidden: !isEditable,
        }
    ];

    return <TableRowActions actions={actions}/>;
};

export const getColumns = (): ColumnDef<any>[] => [
    {
        id: "index",
        header: () => <div className="text-center font-bold uppercase text-[10px] tracking-widest w-[50px]">#</div>,
        cell: ({row, table}) => {
            const sortedIndex = table.getSortedRowModel().flatRows.findIndex(
                (r) => r.original.id === row.original.id
            );
            return <div className="text-center font-mono text-xs text-muted-foreground">{sortedIndex + 1}</div>;
        },
    },
    {
        accessorKey: "name",
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                        className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                        data-active={!!isSorted}>
                    Campaign
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                </Button>
            );
        },
        cell: ({row}) => (
            <Link href={`/email/campaigns/${row.original.id}`}
                  className="font-bold text-sm hover:text-primary transition-colors flex items-center gap-2">
                {row.original.name}
            </Link>
        ),
    },
    {
        id: "from",
        accessorFn: (row) => `${row.fromName} ${row.fromEmail}`,
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                        className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                        data-active={!!isSorted}>
                    Sender Details
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                </Button>
            );
        },
        cell: ({row}) => (
            <div className="flex flex-col">
                <span className="font-bold text-xs tracking-tight">{row.original.fromName}</span>
                <span className="text-[10px] text-muted-foreground font-medium">{row.original.fromEmail}</span>
            </div>
        ),
    },
    {
        accessorKey: "status",
        header: ({column}) => {
            const isSorted = column.getIsSorted();
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(isSorted === "asc")}
                        className="-ml-4 h-8 text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 data-[active=true]:text-primary"
                        data-active={!!isSorted}>
                    Status
                    <HugeIcon
                        name={isSorted ? (isSorted === "asc" ? "ArrowUp01Icon" : "ArrowDown01Icon") : "Sorting05Icon"}
                        size={14}
                        className={cn("ml-2 transition-transform", isSorted ? "text-primary" : "opacity-50")}/>
                </Button>
            );
        },
        cell: ({row}) => {
            const status = row.original.status;
            return (
                <Badge variant={statusVariant[status] ?? "secondary"}
                       className="uppercase text-[9px] font-black tracking-widest px-2 py-0.5">
                    {status}
                </Badge>
            );
        },
    },
    {
        accessorKey: "totalRecipients",
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest">Recipients</div>,
        cell: ({row}) => <div className="font-mono text-xs font-bold">{row.original.totalRecipients}</div>,
    },
    {
        id: "engagement",
        header: () => <div className="font-bold uppercase text-[10px] tracking-widest">Engagement</div>,
        cell: ({row}) => {
            const c = row.original;
            const openRate = c.sentCount > 0 ? ((c.openedCount / c.sentCount) * 100).toFixed(1) : "0.0";
            return (
                <div className="flex flex-col gap-1 w-[100px]">
                    <div
                        className="flex items-center justify-between text-[9px] font-black uppercase text-muted-foreground">
                        <span>{c.sentCount} Sent</span>
                        <span className="text-emerald-600">{openRate}%</span>
                    </div>
                </div>
            );
        },
    },
    generateDateColumn("scheduledAt", "Scheduled At"),
    {
        id: "actions",
        header: () => <div className="w-[40px]"/>,
        cell: ActionCell,
    },
];