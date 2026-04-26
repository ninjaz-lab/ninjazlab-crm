import {Badge} from "@/components/ui/badge";
import {HugeIcon} from "@/components/huge-icon";
import {CAMPAIGN_TYPE} from "@/lib/enums";

interface Props {
    type: typeof CAMPAIGN_TYPE[keyof typeof CAMPAIGN_TYPE];
}

export function CampaignTypeBadge({type}: Props) {
    const config = {
        [CAMPAIGN_TYPE.EMAIL]: {
            label: "Email Campaign",
            icon: "Mail01Icon",
            className: "text-white bg-blue-600",
        },
        [CAMPAIGN_TYPE.SMS]: {
            label: "SMS Campaign",
            icon: "Message02Icon",
            className: "text-white bg-pink-600",
        },
    };

    const {label, icon, className} = config[type] || {
        label: type,
        icon: "Send01Icon",
        className: "text-white bg-gray-600"
    };

    return (
        <Badge className={`text-[10px] uppercase font-bold rounded-full ${className}`}>
            <HugeIcon name={icon as any} size={12} className="mr-1"/>
            {label}
        </Badge>
    );
}
