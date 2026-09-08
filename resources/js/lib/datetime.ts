export function parseISODate(value?: string | null): Date | undefined {
    if (!value) {
        return undefined;
    }

    const match = value.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
        return undefined;
    }

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

    return Number.isNaN(date.getTime()) ? undefined : date;
}

export function toISODate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function parseTimeValue(value?: string | null): string {
    if (!value) {
        return '';
    }

    const match = value.match(/^(\d{1,2}):(\d{2})/);

    if (!match) {
        return '';
    }

    return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
}

export function normalizeDateValue(value?: string | null): string {
    const parsed = parseISODate(value);

    return parsed ? toISODate(parsed) : '';
}

export function formatDisplayDate(date: Date): string {
    return date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function formatDisplayTime(value: string): string {
    const parsed = parseTimeValue(value);

    if (!parsed) {
        return '';
    }

    const [hourRaw, minute] = parsed.split(':');
    const hour24 = Number(hourRaw);
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;

    return `${hour12}:${minute} ${period}`;
}
