import {USER_ROLES} from "@/lib/enums";
import {MetricCard} from "@/components/metric-card";

interface Props {
    metrics: {
        superadmins: number;
        admins: number;
        users: number;
    };
    setRoleFilter: (role: string | null) => void;
}

export function UserMetrics({metrics, setRoleFilter}: Props) {
    return (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 overflow-visible">
            <div onClick={() => setRoleFilter(USER_ROLES.SUPERADMIN)}>
                <MetricCard title="Superadmins"
                            value={metrics.superadmins}
                            icon="CrownIcon"
                            variant="warning"/>
            </div>

            <div onClick={() => setRoleFilter(USER_ROLES.ADMIN)}>
                <MetricCard title="Admins"
                            value={metrics.admins}
                            icon="Shield02Icon"
                            variant="primary"/>
            </div>

            <div onClick={() => setRoleFilter(USER_ROLES.USER)}>
                <MetricCard title="Users"
                            value={metrics.users}
                            icon="UserIcon"
                            variant="default"/>
            </div>
        </div>
    );
}