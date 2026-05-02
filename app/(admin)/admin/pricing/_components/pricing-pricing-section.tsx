"use client";

import React, {useCallback, useState} from "react";
import {format} from "date-fns";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Calendar} from "@/components/ui/calendar";
import {HugeIcon} from "@/components/huge-icon";
import {cn} from "@/lib/utils/utils";

interface PricingPricingSectionProps {
    unitPrice: string;
    onPriceChange: (price: string) => void;
    effectiveFrom: string;
    onEffectiveFromChange: (date: string) => void;
    note: string;
    onNoteChange: (note: string) => void;
}

export const PricingPricingSection = React.memo(function PricingPricingSection({
    unitPrice,
    onPriceChange,
    effectiveFrom,
    onEffectiveFromChange,
    note,
    onNoteChange,
}: PricingPricingSectionProps) {
    const [calendarOpen, setCalendarOpen] = useState(false);

    const handleDateSelect = useCallback((date: Date | undefined) => {
        if (!date) return;
        const current = effectiveFrom ? new Date(effectiveFrom) : new Date();
        date.setHours(current.getHours());
        date.setMinutes(current.getMinutes());
        onEffectiveFromChange(format(date, "yyyy-MM-dd'T'HH:mm"));
        setCalendarOpen(false);
    }, [effectiveFrom, onEffectiveFromChange]);

    const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.target.value;
        if (!time) return;
        const [hours, minutes] = time.split(':');
        const date = effectiveFrom ? new Date(effectiveFrom) : new Date();
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes, 10));
        onEffectiveFromChange(format(date, "yyyy-MM-dd'T'HH:mm"));
    }, [effectiveFrom, onEffectiveFromChange]);

    return (
        <>
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

                            <Input type="time"
                                   value={effectiveFrom ? format(new Date(effectiveFrom), "HH:mm") : ""}
                                   onChange={handleTimeChange}
                                   className="h-9 w-[110px] text-sm font-mono font-bold appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

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
        </>
    );
});
