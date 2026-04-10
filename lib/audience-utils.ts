export type ImportField =
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "address"
    | "city"
    | "state"
    | "country"
    | "postalCode"
    | "notes"
    | "skip";

export const IMPORT_FIELD_LABELS: Record<ImportField, string> = {
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    city: "City",
    state: "State",
    country: "Country",
    postalCode: "Postal Code",
    notes: "Notes",
    skip: "— Skip —",
};

/** Auto-suggest column → field mapping based on header names */
export function suggestMapping(headers: string[]): Record<string, ImportField> {
    const map: Record<string, ImportField> = {};
    const patterns: [RegExp, ImportField][] = [
        [/first.?name|fname/i, "firstName"],
        [/last.?name|lname|surname/i, "lastName"],
        [/e.?mail/i, "email"],
        [/phone|mobile|tel/i, "phone"],
        [/address|street/i, "address"],
        [/city|town/i, "city"],
        [/state|province/i, "state"],
        [/country/i, "country"],
        [/postal|zip/i, "postalCode"],
        [/notes?|comment/i, "notes"],
    ];
    for (const header of headers) {
        const match = patterns.find(([re]) => re.test(header));
        map[header] = match ? match[1] : "skip";
    }
    return map;
}

export function sanitizeValue(val: any): string {
    if (val === null || val === undefined)
        return "";
    const strVal = String(val).trim();

    // Check if the string is formatted as scientific notation (e.g., "6.01E+11" or "6.0123e11")
    if (/^-?\d+(\.\d+)?([eE][+-]?\d+)$/.test(strVal)) {
        // Parse it back to a float, then convert to a string without commas
        return Number(strVal).toLocaleString('fullwide', {useGrouping: false});
    }

    return strVal;
}

export type SegmentRule = {
    field: string;
    type: "standard" | "custom";
    operator: "equals" | "not_equals" | "contains";
    value: string;
};
