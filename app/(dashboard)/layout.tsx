import {UserSidebar} from "@/components/dashboard/user-sidebar";
import {DashboardHeader} from "@/components/dashboard/user-header";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";

export default function DashboardLayout({children}: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <UserSidebar/>
            <SidebarInset>
                <DashboardHeader/>
                <main className="flex-1 p-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
