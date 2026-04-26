import {Badge} from "@/components/ui/badge";
import {TRANSACTION_STATUS} from "@/lib/enums";
import {cn} from "@/lib/utils/utils";

interface Props {
    status: string;
}

export function TransactionStatusBadge({status}: Props) {
    const statusValue = status || TRANSACTION_STATUS.PENDING;

    return (
        <div className="flex justify-center">
            <Badge variant="secondary"
                   className={cn(
                       "w-[75px] justify-center text-[9px] uppercase font-black tracking-widest px-0 py-0.5 border shadow-none",
                       statusValue === TRANSACTION_STATUS.APPROVED
                           ? "text-emerald-600 border-emerald-200 bg-emerald-50"
                           : "text-amber-600 border-amber-200 bg-amber-50",
                       statusValue === TRANSACTION_STATUS.REJECTED && "text-rose-600 border-rose-200 bg-rose-50"
                   )}>
                {statusValue}
            </Badge>
        </div>
    );
}
