import {UserSidebar} from "@/components/dashboard/user-sidebar";
import {UserHeader} from "@/components/dashboard/user-header";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";

export default function UserLayout({children}: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <UserSidebar/>
            <SidebarInset>
                <UserHeader/>
                <main className="flex-1 p-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
