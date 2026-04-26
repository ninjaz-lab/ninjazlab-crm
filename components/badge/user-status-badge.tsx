import {Badge} from "@/components/ui/badge";
import {HugeIcon} from "@/components/huge-icon";

export function UserStatusBadge({banned}: { banned: boolean }) {
    if (banned) {
        return (
            <Badge variant="destructive"
                   className="rounded-full font-black text-[9px] uppercase tracking-wider py-0.5 pr-2 pl-1 gap-1 shrink-0">
                <HugeIcon name="UserBlock01Icon" size={12}/> Banned
            </Badge>
        );
    }
    return (
        <Badge variant="outline"
               className="text-emerald-600 border-emerald-200 bg-emerald-50 rounded-full font-black text-[9px] uppercase tracking-wider py-0.5 pr-2 pl-1 gap-1 shrink-0">
            <HugeIcon name="UserCheck02Icon" size={12}/> Active
        </Badge>
    );
}
