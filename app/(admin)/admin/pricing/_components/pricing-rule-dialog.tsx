"use client";

import React from "react";
import {format} from "date-fns";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,} from "@/components/ui/command";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Calendar} from "@/components/ui/calendar";
import {HugeIcon} from "@/components/huge-icon";
import {cn} from "@/lib/utils/utils";
import {TRANSACTION_CAMPAIGN, TRANSACTION_MODULE_LABELS, USER_ROLES} from "@/lib/enums";

interface User {
    id: string;
    name: string;
    email: string;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isEditing: boolean;
    isPending: boolean;
    scope: "default" | string;
    onScopeChange: (scope: "default" | string) => void;
    selectedUserId: string;
    onUserChange: (userId: string) => void;
    campaign: string;
    onCampaignChange: (campaign: string) => void;
    unitPrice: string;
    onPriceChange: (price: string) => void;
    effectiveFrom: string;
    onEffectiveFromChange: (date: string) => void;
    note: string;
    onNoteChange: (note: string) => void;
    error: string;
    onSave: () => void;
    onCancel: () => void;
    users: User[];
    comboboxOpen: boolean;
    onComboboxOpenChange: (open: boolean) => void;
}

export function PricingRuleDialog({
                                      open, onOpenChange,
                                      isEditing,
                                      isPending,
                                      scope, onScopeChange,
                                      selectedUserId,
                                      onUserChange,
                                      campaign, onCampaignChange,
                                      unitPrice, onPriceChange,
                                      effectiveFrom, onEffectiveFromChange,
                                      note, onNoteChange,
                                      error,
                                      onSave,
                                      onCancel,
                                      users,
                                      comboboxOpen,
                                      onComboboxOpenChange,
                                  }: Props) {
    const selectedUser = users.find((u) => u.id === selectedUserId);

    const [calendarOpen, setCalendarOpen] = React.useState(false);

    // --- Date/Time Handlers ---
    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;
        const current = effectiveFrom ? new Date(effectiveFrom) : new Date();
        date.setHours(current.getHours());
        date.setMinutes(current.getMinutes());
        onEffectiveFromChange(format(date, "yyyy-MM-dd'T'HH:mm"));
        setCalendarOpen(false);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.target.value;
        if (!time) return;
        const [hours, minutes] = time.split(':');
        const date = effectiveFrom ? new Date(effectiveFrom) : new Date();
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes, 10));
        onEffectiveFromChange(format(date, "yyyy-MM-dd'T'HH:mm"));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0">

                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-5 border-b">
                    <div className="flex items-start gap-3">
                        <div
                            className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <HugeIcon name="ArrowUpRight01Icon" size={18} className="text-primary"/>
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold">
                                {isEditing ? "Edit Pricing Rule" : "New Pricing Rule"}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {isEditing
                                    ? "Update the rate, date, or notes for this rule."
                                    : "Set a billing rate for a campaign and scope."}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

                    {/* Scope Selector */}
                    <fieldset disabled={isEditing} className="space-y-2">
                        <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Scope
                        </legend>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                {
                                    value: "default",
                                    label: "Global Rate",
                                    icon: "GlobalIcon",
                                    desc: "Applies to all users"
                                },
                                {
                                    value: USER_ROLES.USER,
                                    label: "User Override",
                                    icon: "UserIcon",
                                    desc: "Applies to one user"
                                },
                            ].map(({value, label, icon, desc}) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => onScopeChange(value)}
                                    className={cn(
                                        "relative flex items-center gap-3 rounded-lg border-2 px-3 py-3 text-left transition-all",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                        "disabled:pointer-events-none disabled:opacity-50",
                                        scope === value
                                            ? "border-primary bg-primary/5"
                                            : "border-border bg-muted/30 hover:border-muted-foreground/40 hover:bg-muted/50"
                                    )}
                                >
                                    <div className={cn(
                                        "flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center",
                                        scope === value ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                                    )}>
                                        <HugeIcon name={icon as any} size={16}/>
                                    </div>
                                    <div className="min-w-0">
                                        <p className={cn(
                                            "text-xs font-semibold leading-none",
                                            scope === value ? "text-primary" : "text-foreground"
                                        )}>
                                            {label}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-1 leading-none truncate">{desc}</p>
                                    </div>
                                    {scope === value && (
                                        <div
                                            className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                            <HugeIcon name="Tick01Icon" size={10} className="text-primary-foreground"/>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    {/* Campaign + User row */}
                    <div className={cn(
                        "grid gap-4",
                        scope === USER_ROLES.USER ? "grid-cols-2" : "grid-cols-1"
                    )}>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Campaign</Label>
                            <Select value={campaign} onValueChange={onCampaignChange} disabled={isEditing}>
                                <SelectTrigger className="h-9 text-sm font-medium">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(TRANSACTION_CAMPAIGN)
                                        .filter((m) => m !== TRANSACTION_CAMPAIGN.SYSTEM)
                                        .map((m) => (
                                            <SelectItem key={m} value={m} className="text-sm font-medium">
                                                {TRANSACTION_MODULE_LABELS[m] || m}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {scope === USER_ROLES.USER && (
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
                        )}
                    </div>

                    {/* Pricing Section */}
                    <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider -mb-1">
                            Pricing Details
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Unit Price</Label>
                                <div className="relative">
                                    <Input className="pr-14 h-9 text-sm font-mono font-semibold"
                                           value={unitPrice}
                                           onChange={(e) => onPriceChange(e.target.value)}
                                           placeholder="0.10"
                                    />
                                    <span
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                        MYR
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Effective From</Label>
                                <div className="flex items-center gap-2">
                                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline"
                                                    className={cn(
                                                        "flex-1 justify-start text-left h-9 text-sm font-medium px-3",
                                                        !effectiveFrom && "text-muted-foreground font-normal"
                                                    )}
                                            >
                                                <HugeIcon name="Calendar01Icon" size={14}
                                                          className="mr-2 opacity-50 flex-shrink-0"/>
                                                {/* Button now only shows the Date */}
                                                {effectiveFrom ? format(new Date(effectiveFrom), "MMM d, yyyy") :
                                                    <span>Pick date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single"
                                                      selected={effectiveFrom ? new Date(effectiveFrom) : undefined}
                                                      onSelect={handleDateSelect}
                                                      initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    {/* Separate clean time input exactly as Shadcn suggests */}
                                    <Input type="time"
                                           value={effectiveFrom ? format(new Date(effectiveFrom), "HH:mm") : ""}
                                           onChange={handleTimeChange}
                                           className="h-9 w-[110px] text-sm font-mono font-bold appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                            Note <span className="text-muted-foreground font-normal normal-case tracking-normal">— optional</span>
                        </Label>
                        <Input
                            value={note}
                            onChange={(e) => onNoteChange(e.target.value)}
                            placeholder="e.g. Q4 Promotional Rate"
                            className="h-9 text-sm"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5">
                            <HugeIcon name="InformationCircleIcon" size={14}
                                      className="mt-0.5 flex-shrink-0 text-destructive"/>
                            <p className="text-xs font-medium text-destructive leading-snug">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-4 border-t bg-muted/10 flex-row justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={onCancel} className="font-medium">
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={onSave}
                        disabled={isPending}
                        className="font-semibold min-w-[110px]"
                    >
                        {isPending
                            ? <><HugeIcon name="Loading03Icon" size={14} className="mr-1.5 animate-spin"/> Saving…</>
                            : isEditing ? "Save Changes" : "Create Rule"
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}