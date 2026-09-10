/**
 * Time-of-day formatting for attendance.
 *
 * Attendance times are wall-clock times in the workspace's timezone, so they
 * must be rendered in that zone rather than the device's. Otherwise an employee
 * travelling, or with a misconfigured device clock, sees the wrong check-in time.
 */

let defaultTimeZone: string | undefined;

export function setDefaultTimeZone(timeZone?: string | null): void {
    defaultTimeZone = timeZone ?? undefined;
}

export function getDefaultTimeZone(): string | undefined {
    return defaultTimeZone;
}

/** n = "14:05" or "14:05:30" — already a wall-clock time, no zone maths needed. */
const CLOCK_PATTERN = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;

export function isClockString(value: string): boolean {
    return CLOCK_PATTERN.test(value.trim());
}

/** "14:05" -> minutes since midnight, or null when unparseable. */
export function clockToMinutes(value?: string | null): number | null {
    if (!value) {
        return null;
    }

    const match = value.trim().match(CLOCK_PATTERN);

    if (!match) {
        return null;
    }

    return Number(match[1]) * 60 + Number(match[2]);
}

function formatMinutesOfDay(minutes: number): string {
    const hour24 = Math.floor(minutes / 60) % 24;
    const minute = minutes % 60;
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;

    return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

/**
 * Render a time as e.g. "2:41 AM".
 *
 * Accepts either a plain wall-clock string ("02:41", as returned by the month
 * report) or an ISO timestamp, which is converted into the workspace timezone.
 */
export function formatClock(
    value?: string | null,
    timeZone?: string | null,
): string {
    if (!value) {
        return '—';
    }

    const minutes = clockToMinutes(value);

    if (minutes !== null) {
        return formatMinutesOfDay(minutes);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    const zone = timeZone ?? defaultTimeZone;

    try {
        return new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            ...(zone ? { timeZone: zone } : {}),
        }).format(date);
    } catch {
        // An unknown timezone identifier should not blank out the UI.
        return new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit',
        }).format(date);
    }
}

/** "14:05" style output, useful where a 24-hour clock is wanted. */
export function formatClock24(value?: string | null): string {
    const minutes = clockToMinutes(value);

    if (minutes === null) {
        return '—';
    }

    const hour = Math.floor(minutes / 60) % 24;

    return `${String(hour).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** Short label such as "GMT+6" for the active workspace timezone. */
export function timeZoneOffsetLabel(timeZone?: string | null): string | null {
    const zone = timeZone ?? defaultTimeZone;

    if (!zone) {
        return null;
    }

    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: zone,
            timeZoneName: 'shortOffset',
        }).formatToParts(new Date());

        const name = parts.find((part) => part.type === 'timeZoneName')?.value;

        return name ?? null;
    } catch {
        return null;
    }
}
