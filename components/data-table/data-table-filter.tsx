import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {HugeIcon} from "@/components/huge-icon";

interface Props {
    value: string;
    onChange: (val: string) => void;
    options: { label: string; value: string }[];
    placeholder?: string;
    icon?: string;
}

export function DataTableFilter({value, onChange, options, placeholder = "Filter...", icon}: Props) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[160px] h-10 font-bold bg-muted/20 border-muted-foreground/20">
                <div className="flex items-center gap-2">
                    {icon && <HugeIcon name={icon as any} size={14} className="text-muted-foreground"/>}
                    <SelectValue placeholder={placeholder}/>
                </div>
            </SelectTrigger>
            <SelectContent>
                {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="font-bold cursor-pointer">
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
