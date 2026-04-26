import {JSX} from "react";
import {Badge} from "@/components/ui/badge";
import {HugeIcon} from "@/components/huge-icon";

interface Props {
    effectiveFrom: Date;
    isLatest: boolean;
}

export function PricingStatusBadge({effectiveFrom, isLatest}: Props): JSX.Element {
    const now = new Date();
    const effectiveDate = new Date(effectiveFrom);

    // If not the latest rule for this scope+campaign, mark as expired
    if (!isLatest) {
        return (
            <Badge className="text-[10px] uppercase font-bold text-white bg-gray-500 rounded-full">
                Expired
            </Badge>
        );
    }

    // Check if future (scheduled)
    if (effectiveDate > now) {
        return (
            <Badge className="text-[10px] uppercase font-bold text-white bg-yellow-500 rounded-full">
                <HugeIcon name="Calendar03Icon" size={12} className="mr-1"/> Scheduled
            </Badge>
        );
    }

    // Latest rule with past effectiveFrom is active
    return (
        <Badge className="text-[10px] uppercase font-bold text-white bg-primary rounded-full">
            Active
        </Badge>
    );
}
