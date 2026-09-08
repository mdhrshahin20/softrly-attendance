import { Clock3, Minus, Plus } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDisplayTime, parseTimeValue } from '@/lib/datetime';
import { cn } from '@/lib/utils';

type TimePickerProps = {
    name?: string;
    id?: string;
    defaultValue?: string;
    value?: string;
    onChange?: (value: string) => void;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
};

type ClockMode = 'hour' | 'minute';

function pad(value: number): string {
    return String(value).padStart(2, '0');
}

function toTimeValue(hour24: number, minute: number): string {
    return `${pad(((hour24 % 24) + 24) % 24)}:${pad(((minute % 60) + 60) % 60)}`;
}

function splitTime(value: string): { hour24: number; hour12: number; minute: number; period: 'AM' | 'PM' } {
    const parsed = parseTimeValue(value) || '09:00';
    const [hourRaw, minuteRaw] = parsed.split(':');
    const hour24 = Number(hourRaw);
    const minute = Number(minuteRaw);

    return {
        hour24,
        hour12: hour24 % 12 || 12,
        minute,
        period: hour24 >= 12 ? 'PM' : 'AM',
    };
}

function polar(cx: number, cy: number, radius: number, angleDeg: number) {
    const radians = ((angleDeg - 90) * Math.PI) / 180;

    return {
        x: cx + radius * Math.cos(radians),
        y: cy + radius * Math.sin(radians),
    };
}

export function TimePicker({
    name,
    id,
    defaultValue = '',
    value,
    onChange,
    required = false,
    placeholder = 'Pick a time',
    disabled = false,
    className,
}: TimePickerProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const isControlled = value !== undefined;
    const [open, setOpen] = useState(false);
    const [internal, setInternal] = useState(parseTimeValue(defaultValue));
    const [mode, setMode] = useState<ClockMode>('hour');
    const selectedValue = parseTimeValue(isControlled ? value : internal);
    const parts = splitTime(selectedValue || '09:00');

    useEffect(() => {
        if (!isControlled) {
            setInternal(parseTimeValue(defaultValue));
        }
    }, [defaultValue, isControlled]);

    function commit(next: string) {
        if (!isControlled) {
            setInternal(next);
        }

        onChange?.(next);
    }

    function setFromClock(nextHour12: number, nextMinute: number, nextPeriod: 'AM' | 'PM') {
        let hour24 = nextHour12 % 12;

        if (nextPeriod === 'PM') {
            hour24 += 12;
        }

        commit(toTimeValue(hour24, nextMinute));
    }

    const numbers = useMemo(() => {
        if (mode === 'hour') {
            return [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        }

        return [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    }, [mode]);

    const handAngle = mode === 'hour' ? parts.hour12 * 30 : parts.minute * 6;
    const hand = polar(112, 112, mode === 'hour' ? 58 : 68, handAngle);

    function handleClockClick(event: React.MouseEvent<SVGSVGElement>) {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - bounds.left - bounds.width / 2;
        const y = event.clientY - bounds.top - bounds.height / 2;
        let angle = (Math.atan2(y, x) * 180) / Math.PI + 90;

        if (angle < 0) {
            angle += 360;
        }

        if (mode === 'hour') {
            const hour12 = Math.round(angle / 30) % 12 || 12;
            setFromClock(hour12, parts.minute, parts.period);
            setMode('minute');

            return;
        }

        const minute = Math.round(angle / 6) % 60;
        setFromClock(parts.hour12, minute, parts.period);
    }

    return (
        <div className={cn('w-full', className)}>
            {name ? (
                <input
                    id={inputId}
                    name={name}
                    value={selectedValue}
                    required={required}
                    readOnly
                    tabIndex={-1}
                    className="sr-only"
                    onChange={() => undefined}
                />
            ) : null}
            <Popover
                open={open}
                onOpenChange={(next) => {
                    setOpen(next);

                    if (next) {
                        setMode('hour');
                    }
                }}
            >
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        data-empty={!selectedValue}
                        className="data-[empty=true]:text-muted-foreground h-9 w-full justify-start px-3 text-left font-normal"
                    >
                        <Clock3 className="size-4" />
                        {selectedValue ? formatDisplayTime(selectedValue) : placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-4" align="start">
                    <div className="space-y-3">
                        <div className="flex items-end justify-center gap-1 font-medium tracking-tight">
                            <button
                                type="button"
                                className={cn(
                                    'rounded-md px-1 text-3xl',
                                    mode === 'hour' ? 'text-primary' : 'text-muted-foreground',
                                )}
                                onClick={() => setMode('hour')}
                            >
                                {pad(parts.hour12)}
                            </button>
                            <span className="text-3xl">:</span>
                            <button
                                type="button"
                                className={cn(
                                    'rounded-md px-1 text-3xl',
                                    mode === 'minute' ? 'text-primary' : 'text-muted-foreground',
                                )}
                                onClick={() => setMode('minute')}
                            >
                                {pad(parts.minute)}
                            </button>
                            <div className="mb-1 ml-2 grid gap-1">
                                {(['AM', 'PM'] as const).map((period) => (
                                    <button
                                        key={period}
                                        type="button"
                                        className={cn(
                                            'h-6 rounded-md px-2 text-[11px] font-semibold',
                                            parts.period === period
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground',
                                        )}
                                        onClick={() => setFromClock(parts.hour12, parts.minute, period)}
                                    >
                                        {period}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <svg
                            viewBox="0 0 224 224"
                            className="mx-auto size-56 cursor-pointer select-none"
                            onClick={handleClockClick}
                            role="img"
                            aria-label={mode === 'hour' ? 'Hour clock' : 'Minute clock'}
                        >
                            <circle cx="112" cy="112" r="108" className="fill-muted/60 stroke-border" strokeWidth="1" />
                            <line
                                x1="112"
                                y1="112"
                                x2={hand.x}
                                y2={hand.y}
                                className="stroke-primary"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            <circle cx="112" cy="112" r="5" className="fill-primary" />
                            {numbers.map((value, index) => {
                                const point = polar(112, 112, 86, index * 30);
                                const active =
                                    mode === 'hour' ? value === parts.hour12 : value === Math.round(parts.minute / 5) * 5;

                                return (
                                    <g key={`${mode}-${value}`}>
                                        <circle
                                            cx={point.x}
                                            cy={point.y}
                                            r="14"
                                            className={active ? 'fill-primary' : 'fill-transparent'}
                                        />
                                        <text
                                            x={point.x}
                                            y={point.y + 4}
                                            textAnchor="middle"
                                            className={active ? 'fill-primary-foreground' : 'fill-foreground'}
                                            fontSize="12"
                                            fontWeight="600"
                                        >
                                            {mode === 'hour' ? value : pad(value)}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>

                        <div className="flex items-center justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    setFromClock(
                                        mode === 'hour' ? (parts.hour12 === 1 ? 12 : parts.hour12 - 1) : parts.hour12,
                                        mode === 'minute' ? parts.minute - 1 : parts.minute,
                                        parts.period,
                                    )
                                }
                            >
                                <Minus className="size-4" />
                            </Button>
                            <p className="text-muted-foreground text-xs">
                                {mode === 'hour' ? 'Tap the clock for the hour' : 'Tap the clock for minutes'}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    setFromClock(
                                        mode === 'hour' ? (parts.hour12 === 12 ? 1 : parts.hour12 + 1) : parts.hour12,
                                        mode === 'minute' ? parts.minute + 1 : parts.minute,
                                        parts.period,
                                    )
                                }
                            >
                                <Plus className="size-4" />
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
