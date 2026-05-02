import {formatInTimeZone, fromZonedTime} from "date-fns-tz";

export const APP_TIMEZONE = "Asia/Kuala_Lumpur";

export function formatToAppTimezone(date: Date | string | null, formatStr: string = "yyyy-MM-dd'T'HH:mm"): string {
    if (!date) return "";
    return formatInTimeZone(new Date(date), APP_TIMEZONE, formatStr);
}

export function parseFromAppTimezone(dateString: string): Date {
    return fromZonedTime(dateString, APP_TIMEZONE);
}
