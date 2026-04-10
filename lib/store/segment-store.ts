import {create} from "zustand";
import {getAvailableFields, getDistinctFieldValues} from "@/lib/actions/segment";

type FieldDef = {
    id: string;
    label: string;
    type: "standard" | "custom",
    inputType: "select" | "text";
};

export type UIRule = {
    id: string;
    field: string;
    operator: string;
    value: string;
};

interface SegmentState {
    name: string;
    colorPicker: string;
    fields: FieldDef[];
    rules: UIRule[];
    fieldValuesCache: Record<string, string[]>; // Caches distinct values to prevent duplicate DB calls

    setName: (name: string) => void;
    setColorPicker: (color: string) => void;
    fetchFields: () => Promise<void>;
    addRule: () => void;
    updateRuleField: (id: string, fieldId: string) => Promise<void>;
    updateRuleOperator: (id: string, operator: string) => void;
    updateRuleValue: (id: string, value: string) => void;
    removeRule: (id: string) => void;
}

export const useSegmentStore = create<SegmentState>((set, get) => ({
    name: "",
    colorPicker: "#3b82f6",
    fields: [],
    // Start with one empty rule by default
    rules: [{
        id: "initial-rule",
        field: "",
        operator: "equals",
        value: ""
    }],
    fieldValuesCache: {},

    setName: (name) => set({name}),
    setColorPicker: (color) => set({colorPicker: color}),

    fetchFields: async () => {
        const fields = await getAvailableFields();
        set({fields});
    },

    addRule: () => set((state) => ({
        // Use crypto.randomUUID() to ensure each rule row has a unique key
        rules: [...state.rules, {id: crypto.randomUUID(), field: "", operator: "equals", value: ""}]
    })),

    updateRuleField: async (id, fieldId) => {
        // 1. Update the rule's field and reset its selected value
        set((state) => ({
            rules: state.rules.map(r => r.id === id
                ? {...r, field: fieldId, value: "", operator: "equals"}
                : r
            )
        }));

        const {fields, fieldValuesCache} = get();
        const fieldDef = fields.find(f => f.id === fieldId);

        // 2. Fetch distinct values for the dropdown if we haven't cached them yet!
        if (fieldDef && fieldDef.inputType === "select" && !fieldValuesCache[fieldId]) {
            const distinctValues = await getDistinctFieldValues(fieldDef.id, fieldDef.type);
            set((state) => ({
                fieldValuesCache: {...state.fieldValuesCache, [fieldId]: distinctValues}
            }));
        }
    },

    updateRuleOperator: (id, operator) => set((state) => ({
        rules: state.rules.map(r => r.id === id ? {...r, operator} : r)
    })),

    updateRuleValue: (id, value) => set((state) => ({
        rules: state.rules.map(r => r.id === id ? {...r, value} : r)
    })),

    removeRule: (id) => set((state) => ({
        rules: state.rules.filter(r => r.id !== id)
    })),
}));