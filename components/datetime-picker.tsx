"use client";

import * as React from "react";
import {format} from "date-fns";
import {HugeIcon} from "@/components/huge-icon";
import {Button} from "@/components/ui/button";
import {Calendar} from "@/components/ui/calendar";
import {Input} from "@/components/ui/input";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {cn} from "@/lib/utils/utils";

interface Props {
    value?: Date;
    onChange?: (date: Date | undefined) => void;
    disabled?: boolean;
    className?: string;
}

export function DateTimePicker({value, onChange, disabled, className}: Props) {
    const [calendarOpen, setCalendarOpen] = React.useState(false);

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;
        const current = value || new Date();
        date.setHours(current.getHours(), current.getMinutes(), 0, 0);
        onChange?.(date);
        setCalendarOpen(false);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.target.value;
        if (!time) return;
        const [hours, minutes] = time.split(':');
        const date = value ? new Date(value) : new Date();
        date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        onChange?.(date);
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* Date Picker Button */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline"
                            disabled={disabled}
                            className={cn(
                                "flex-1 justify-start text-left h-10 font-medium px-3",
                                !value && "text-muted-foreground font-normal"
                            )}
                    >
                        <HugeIcon name="Calendar01Icon" size={16} className="mr-2 opacity-50 flex-shrink-0"/>
                        {value ? format(value, "MMM d, yyyy") : <span>Pick date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={handleDateSelect}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            {/* Native Time Input */}
            <Input type="time"
                   disabled={disabled || !value}
                   value={value ? format(value, "HH:mm") : ""}
                   onChange={handleTimeChange}
                   className="h-10 w-[120px] font-mono font-bold appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
            />
        </div>
    );
}