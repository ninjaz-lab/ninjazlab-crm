"use client";

import {useEffect, useState, useTransition} from "react";
import {useSegmentStore} from "@/lib/store/segment-store";
import {
    createDynamicSegment,
    previewSegmentContacts,
    previewSegmentCount,
    updateDynamicSegment
} from "@/lib/actions/segment";
import {type SegmentRule} from "@/lib/audience-utils";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Loader2, Plus, UserCircle2, Users, X} from "lucide-react";
import {toast} from "sonner";

interface Props {
    initialSegment?: any | null;
    onDone?: () => void;
}

const COLOR_PRESETS = [
    {label: "Blue", value: "#3b82f6"},
    {label: "Purple", value: "#a855f7"},
    {label: "Pink", value: "#ec4899"},
    {label: "Red", value: "#ef4444"},
    {label: "Orange", value: "#f97316"},
    {label: "Green", value: "#22c55e"},
    {label: "Slate", value: "#64748b"},
];

export function SegmentBuilder({initialSegment, onDone}: Props) {
    const {
        name, setName,
        colorPicker, setColorPicker,
        matchType, setMatchType,
        fields, fetchFields,
        rules, addRule, setRules,
        updateRuleField, updateRuleOperator, updateRuleValue, removeRule,
        fieldValuesCache
    } = useSegmentStore();

    const [isPreviewing, startPreviewTransition] = useTransition();
    const [pending, startTransition] = useTransition();

    const [previewCount, setPreviewCount] = useState<number | null>(null);
    const [previewContacts, setPreviewContacts] = useState<any[]>([]);

    useEffect(() => {
        void fetchFields();

        if (initialSegment) {
            setName(initialSegment.name);
            setColorPicker(initialSegment.color || "#3b82f6");
            setMatchType(initialSegment.rules?.matchType || "AND");

            if (setRules) {
                const initialRules = initialSegment.rules?.rules || [];
                setRules(initialRules);
            }
        } else {
            // Reset for "Create New" mode
            setName("");
            setColorPicker("#3b82f6");
            setMatchType("AND");

            if (setRules)
                setRules([]);
        }
    }, [initialSegment, fetchFields, setName, setColorPicker, setRules]);

    const getValidBackendRules = (): SegmentRule[] => {
        return rules
            .filter(r => r.field && r.operator && r.value)
            .map(r => {
                const fieldDef = fields.find(f => f.id === r.field);
                return {
                    field: r.field,
                    type: fieldDef?.type || "standard",
                    operator: r.operator as SegmentRule["operator"],
                    value: r.value
                };
            });
    };

    useEffect(() => {
        const validRules = getValidBackendRules();

        if (validRules.length > 0) {
            startPreviewTransition(async () => {
                const [count, contacts] = await Promise.all([
                    previewSegmentCount(validRules, matchType),
                    previewSegmentContacts(validRules, matchType)
                ]);
                setPreviewCount(count);
                setPreviewContacts(contacts);
            });
        } else {
            setPreviewCount(null);
            setPreviewContacts([]);
        }
    }, [rules, fields, matchType]);

    const handleSave = () => {
        const validRules = getValidBackendRules();
        if (!name || validRules.length === 0)
            return;

        startTransition(async () => {
            try {
                if (initialSegment?.id) {
                    await updateDynamicSegment(initialSegment.id, name, colorPicker, validRules);
                    toast.success("Segment updated successfully!");
                } else {
                    await createDynamicSegment(name, colorPicker, validRules);
                    toast.success("Segment created successfully!");
                }

                if (onDone) onDone();
            } catch (error) {
                toast.error("Failed to save segment. Please try again.");
            }
        });
    }

    return (
        <div className="flex h-full w-full">
            {/* Left Column: Form Settings */}
            <div className="w-1/2 p-6 overflow-y-auto flex flex-col space-y-8 bg-background">

                {/* General Settings */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="segment-name">Segment Name</Label>
                        <Input
                            id="segment-name"
                            placeholder="e.g., KL Customers"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Segment Label</Label>
                        <div className="flex gap-3">
                            {COLOR_PRESETS.map((preset) => (
                                <Button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => setColorPicker(preset.value)}
                                    title={preset.label}
                                    className={`size-8 rounded-full transition-all duration-200 border-2 ${
                                        colorPicker === preset.value
                                            ? "border-foreground scale-110 shadow-sm"
                                            : "border-transparent hover:scale-105 hover:shadow-sm"
                                    }`}
                                    style={{backgroundColor: preset.value}}
                                    aria-label={`Select ${preset.label} color`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Rules Section */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground">Match audiences where:</h3>

                    {rules.length > 1 && (
                        <div className="flex items-center gap-2 mb-2 p-3 border rounded-lg bg-muted/30">
                            <span className="text-sm font-medium text-muted-foreground">Contacts must match</span>
                            <Select value={matchType} onValueChange={(val: "AND" | "OR") => setMatchType(val)}>
                                <SelectTrigger className="w-[85px] h-8 bg-background">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AND">ALL</SelectItem>
                                    <SelectItem value="OR">ANY</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-sm font-medium text-muted-foreground">of the following rules:</span>
                        </div>
                    )}

                    {rules.map((rule) => {
                        const ruleValues = fieldValuesCache[rule.field] || [];

                        const selectedFieldDef = fields.find(f => f.id === rule.field);
                        const isTextInput = selectedFieldDef?.inputType === "text";

                        return (
                            <div key={rule.id}
                                 className="flex flex-col gap-3 bg-muted/20 p-4 rounded-xl border shadow-sm relative">
                                {rules.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute -top-3 -right-3 rounded-full shadow-sm border bg-background size-7"
                                        onClick={() => removeRule(rule.id)}
                                    >
                                        <X className="size-3"/>
                                    </Button>
                                )}

                                <Select value={rule.field} onValueChange={(val) => updateRuleField(rule.id, val)}>
                                    <SelectTrigger className="w-full bg-background">
                                        <SelectValue placeholder="Select a field..."/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fields.map(f => (
                                            <SelectItem key={f.id} value={f.id}>
                                                {f.label} {f.type === "custom" && "(Custom)"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={rule.operator} onValueChange={(val) => updateRuleOperator(rule.id, val)}
                                        disabled={!rule.field}>
                                    <SelectTrigger className="w-full bg-background">
                                        <SelectValue placeholder="Operator"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="equals">is exactly</SelectItem>
                                        {isTextInput && (
                                            <>
                                                <SelectItem value="not_equals">is not</SelectItem>
                                                <SelectItem value="contains">contains</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>

                                <div className="relative w-full">
                                    {isTextInput ? (
                                        <Input
                                            placeholder="Type a value..."
                                            value={rule.value}
                                            onChange={(e) => updateRuleValue(rule.id, e.target.value)}
                                            disabled={!rule.field || pending}
                                            className="bg-background"
                                        />
                                    ) : (
                                        <Select value={rule.value}
                                                onValueChange={(val) => updateRuleValue(rule.id, val)}
                                                disabled={!rule.field || pending}>
                                            <SelectTrigger className="w-full bg-background">
                                                <SelectValue placeholder="Select value..."/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ruleValues.length === 0 ? (
                                                    <div className="p-2 text-sm text-muted-foreground text-center">No
                                                        data found</div>
                                                ) : (
                                                    ruleValues.map(v => (
                                                        <SelectItem key={v} value={v}>{v}</SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                        )
                    })}

                    <Button variant="outline" className="border-dashed w-full text-muted-foreground" onClick={addRule}>
                        <Plus className="mr-2 size-4"/> Add another condition
                    </Button>
                </div>

                {/* Save Button */}
                <div className="mt-auto pt-4 border-t">
                    <Button
                        onClick={handleSave} disabled={pending || !name || previewCount === null}
                        className="w-full"
                    >
                        {pending && <Loader2 className="mr-2 size-4 animate-spin"/>}
                        {initialSegment ? "Save Changes" : "Create Segment"}
                    </Button>
                </div>
            </div>

            {/* RIGHT COLUMN: Live Sample Preview */}
            <div className="w-1/2 border-l bg-muted/10 flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-muted/20 shrink-0">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Sample Audience</h3>
                        {previewCount !== null && (
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                {isPreviewing ? "Calculating..." : `${previewCount.toLocaleString()} matching`}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Previewing a sample of contacts that match your
                        rules.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {isPreviewing ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Loader2 className="size-8 animate-spin mb-4"/>
                            <p className="text-sm">Fetching audience sample...</p>
                        </div>
                    ) : previewContacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Users className="size-10 mb-3 opacity-20"/>
                            <p className="text-sm font-medium">No audiences match these rules</p>
                            <p className="text-xs mt-1 text-center max-w-[250px]">Adjust your conditions on the left to
                                see a live preview here.</p>
                        </div>
                    ) : (
                        previewContacts.map(contact => (
                            <div key={contact.id}
                                 className="flex items-center gap-3 p-3 rounded-lg border bg-background shadow-sm">
                                <div
                                    className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                    <UserCircle2 className="size-6 text-muted-foreground"/>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                        {[contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unnamed Contact"}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {contact.email || contact.phone || "No contact info"}
                                    </p>
                                </div>
                                {contact.state && (
                                    <div
                                        className="shrink-0 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                        {contact.state}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}