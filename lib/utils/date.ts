import {format, isValid} from "date-fns";

export function formatDate(date: Date | string | null | undefined): string {
    if (!date)
        return "-";
    const parsedDate = typeof date === "string"
        ? new Date(date)
        : date;
    if (!isValid(parsedDate))
        return "-";
    return format(parsedDate, "MMM dd, yyyy");
}

export function formatTime(date: Date | string | null | undefined): string {
    if (!date)
        return "-";
    const parsedDate = typeof date === "string"
        ? new Date(date)
        : date;
    if (!isValid(parsedDate)) return "-";
    return format(parsedDate, "hh:mm:ss a");
}