"use client";

import React from "react";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {HugeIcon} from "@/components/huge-icon";
import {cn} from "@/lib/utils/utils";
import {USER_ROLES} from "@/lib/enums";

interface User {
    id: string;
    name: string;
    email: string;
}

interface PricingUserSectionProps {
    scope: "default" | string;
    selectedUserId: string;
    onUserChange: (userId: string) => void;
    users: User[];
    comboboxOpen: boolean;
    onComboboxOpenChange: (open: boolean) => void;
    isEditing: boolean;
}

export const PricingUserSection = React.memo(function PricingUserSection({
    scope,
    selectedUserId,
    onUserChange,
    users,
    comboboxOpen,
    onComboboxOpenChange,
    isEditing,
}: PricingUserSectionProps) {
    const selectedUser = users.find((u) => u.id === selectedUserId);

    if (scope !== USER_ROLES.USER) {
        return null;
    }

    return (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <Label className="text-xs font-semibold">Target User</Label>
            <Popover open={comboboxOpen} onOpenChange={onComboboxOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        disabled={isEditing}
                        className="w-full justify-between h-9 text-sm font-medium px-3"
                    >
                        <span
                            className={cn("truncate", !selectedUser && "text-muted-foreground font-normal")}>
                            {selectedUser ? selectedUser.name : "Select user…"}
                        </span>
                        <HugeIcon name="Sorting05Icon" size={14}
                                  className="ml-2 flex-shrink-0 opacity-50"/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search users…" className="text-sm"/>
                        <CommandList>
                            <CommandEmpty
                                className="text-sm py-4 text-center text-muted-foreground">No users
                                found.</CommandEmpty>
                            <CommandGroup>
                                {users.map((user) => (
                                    <CommandItem
                                        key={user.id}
                                        value={user.name}
                                        onSelect={() => {
                                            onUserChange(user.id);
                                            onComboboxOpenChange(false);
                                        }}
                                        className="text-sm"
                                    >
                                        <HugeIcon
                                            name="Tick01Icon"
                                            size={14}
                                            className={cn("mr-2 flex-shrink-0", selectedUserId === user.id ? "opacity-100 text-primary" : "opacity-0")}
                                        />
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
});
