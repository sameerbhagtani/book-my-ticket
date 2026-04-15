const INDIA_TIME_ZONE_OFFSET_MINUTES = 330;

export function parseDateTimeInIST(value) {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value !== "string") {
        return null;
    }

    if (/Z$|[+-]\d{2}:\d{2}$/.test(value)) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const match = value.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d{1,3})?$/,
    );

    if (!match) {
        return null;
    }

    const [
        ,
        yearText,
        monthText,
        dayText,
        hourText,
        minuteText,
        secondText = "0",
    ] = match;

    const timestamp =
        Date.UTC(
            Number(yearText),
            Number(monthText) - 1,
            Number(dayText),
            Number(hourText),
            Number(minuteText),
            Number(secondText),
        ) -
        INDIA_TIME_ZONE_OFFSET_MINUTES * 60 * 1000;

    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
}
