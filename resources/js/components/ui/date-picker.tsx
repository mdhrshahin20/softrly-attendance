import { Calendar as CalendarIcon } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDisplayDate, normalizeDateValue, parseISODate, toISODate } from '@/lib/datetime';
import { cn } from '@/lib/utils';

type DatePickerProps = {
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

export function DatePicker({
    name,
    id,
    defaultValue = '',
    value,
    onChange,
    required = false,
    placeholder = 'Pick a date',
    disabled = false,
    className,
}: DatePickerProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const isControlled = value !== undefined;
    const [open, setOpen] = useState(false);
    const [internal, setInternal] = useState(() => normalizeDateValue(defaultValue));
    const selectedValue = isControlled ? normalizeDateValue(value) : internal;
    const selectedDate = parseISODate(selectedValue);

    useEffect(() => {
        if (!isControlled) {
            setInternal(normalizeDateValue(defaultValue));
        }
    }, [defaultValue, isControlled]);

    function selectDate(date?: Date) {
        const next = date ? toISODate(date) : '';

        if (!isControlled) {
            setInternal(next);
        }

        onChange?.(next);
        setOpen(false);
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
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        data-empty={!selectedDate}
                        className="data-[empty=true]:text-muted-foreground h-9 w-full justify-start px-3 text-left font-normal"
                    >
                        <CalendarIcon className="size-4" />
                        {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        defaultMonth={selectedDate}
                        onSelect={selectDate}
                        captionLayout="dropdown"
                        startMonth={new Date(2000, 0)}
                        endMonth={new Date(new Date().getFullYear() + 5, 11)}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
