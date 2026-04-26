import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {UserTabProfile} from "@/app/(admin)/admin/users/_components/user-tab-profile";
import {UserTabWallet} from "@/app/(admin)/admin/users/_components/user-tab-wallet";
import {UserTabMarketing} from "@/app/(admin)/admin/users/_components/user-tab-marketing";
import {UserTabModules} from "@/app/(admin)/admin/users/_components/user-tab-modules";
import {HugeIcon} from "@/components/huge-icon";

interface UserTabProps {
    data: any;
    allModules: any[];
    effectivePricing: any[];
    onRoleToggle: () => void;
    onBanToggle: () => void;
    onUpdateUser: (updatedUser: any) => void;
    walletProps: any;
}

export function UserTab({data, allModules, effectivePricing, onRoleToggle, onBanToggle, onUpdateUser, walletProps}: UserTabProps) {
    return (
        <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-6 pt-3 shrink-0 bg-background">
                <TabsList className="w-full">
                    <TabsTrigger value="profile">
                        <HugeIcon name="UserIcon" size={14}/> Profile
                    </TabsTrigger>
                    <TabsTrigger value="wallet">
                        <HugeIcon name="Wallet01Icon" size={14}/> Wallet
                    </TabsTrigger>
                    <TabsTrigger value="modules">
                        <HugeIcon name="CubeIcon" size={14}/> Modules
                    </TabsTrigger>
                    <TabsTrigger value="marketing">
                        <HugeIcon name="Calendar01Icon" size={14}/> Events
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="profile" className="flex-1 min-h-0 data-[state=active]:flex flex-col mt-0">
                <UserTabProfile data={data} effectivePricing={effectivePricing} onRoleToggle={onRoleToggle} onBanToggle={onBanToggle}/>
            </TabsContent>

            <TabsContent value="wallet" className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden px-6 data-[state=active]:flex mt-0 pt-4">
                <UserTabWallet {...walletProps} userRole={data.profile.user.role}/>
            </TabsContent>

            <TabsContent value="modules" className="flex-1 flex flex-col min-h-0 data-[state=active]:flex mt-0">
                <UserTabModules user={data.profile.user} allModules={allModules} onUpdateUser={onUpdateUser}/>
            </TabsContent>

            <TabsContent value="marketing" className="flex-1 min-h-0 px-6 data-[state=active]:flex flex-col mt-0 pt-4">
                <UserTabMarketing campaigns={data.ongoingCampaigns}/>
            </TabsContent>
        </Tabs>
    );
}