import {JSX} from "react";
import {Badge} from "@/components/ui/badge";
import {HugeIcon} from "@/components/huge-icon";

interface Props {
    effectiveFrom: Date;
}

export function PricingStatusBadge({effectiveFrom}: Props): JSX.Element {
    const isActive = new Date(effectiveFrom) <= new Date();
    if (isActive) {
        return (
            <Badge className="text-[10px] uppercase font-bold text-white bg-primary rounded-full">
                Active
            </Badge>
        );
    }
    return (
        <Badge className="text-[10px] uppercase font-bold text-white bg-yellow-500 rounded-full">
            <HugeIcon name="Calendar03Icon" size={12} className="mr-1"/> Scheduled
        </Badge>
    );
}
