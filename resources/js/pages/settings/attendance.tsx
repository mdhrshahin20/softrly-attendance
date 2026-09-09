import { Form, Head } from '@inertiajs/react';
import { Fingerprint, Globe, MapPin, Wifi, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Mode = {
    value: string;
    label: string;
    description: string;
    requires_location: boolean;
};

function modeIcon(mode: Mode): LucideIcon {
    if (mode.requires_location) {
        return MapPin;
    }

    if (/network|wifi/i.test(`${mode.label} ${mode.description}`)) {
        return Wifi;
    }

    return Globe;
}

export default function AttendanceSettings({
    mode,
    modes,
    canUseLocation,
}: {
    mode: string;
    modes: Mode[];
    canUseLocation: boolean;
}) {
    return (
        <>
            <Head title="Attendance settings" />
            <div>
                <div>
                    <h2 className="text-lg font-semibold">Attendance mode</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Choose how employees prove they are at work. Employees must follow the
                        active rule every time they check in.
                    </p>
                </div>

                <Form action="/settings/attendance" method="put" className="mt-5 max-w-2xl space-y-4">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-3">
                                {modes.map((item) => {
                                    const Icon = modeIcon(item);
                                    const disabled = item.requires_location && !canUseLocation;
                                    const selected = mode === item.value;

                                    return (
                                        <label
                                            key={item.value}
                                            className={cn(
                                                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                                                selected
                                                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                                                    : 'bg-card hover:border-border',
                                                disabled && 'cursor-not-allowed opacity-60',
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="attendance_method"
                                                value={item.value}
                                                defaultChecked={selected}
                                                disabled={disabled}
                                                className="accent-primary mt-1"
                                            />
                                            <span
                                                className={cn(
                                                    'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
                                                    selected
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'bg-muted text-muted-foreground',
                                                )}
                                            >
                                                <Icon className="size-4" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-sm font-medium">
                                                    {item.label}
                                                </span>
                                                <span className="text-muted-foreground mt-0.5 block text-sm">
                                                    {item.description}
                                                </span>
                                                {item.requires_location && !canUseLocation ? (
                                                    <span className="text-destructive mt-1 block text-xs">
                                                        Requires the location attendance plan.
                                                    </span>
                                                ) : null}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            {errors.attendance_method || errors.plan ? (
                                <p className="text-destructive text-sm">
                                    {errors.attendance_method ?? errors.plan}
                                </p>
                            ) : null}

                            <Button type="submit" disabled={processing}>
                                Save attendance mode
                            </Button>
                        </>
                    )}
                </Form>

                <Card className="mt-8 max-w-2xl">
                    <CardHeader>
                        <CardTitle className="text-base">How this protects attendance</CardTitle>
                        <CardDescription>
                            The rule applies to every check-in from every device.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p className="text-muted-foreground flex items-start gap-2">
                            <Fingerprint className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                            Employees submit attendance only from the office network or GPS radius
                            you authorize under Offices &amp; Wi-Fi.
                        </p>
                        <p className="text-muted-foreground flex items-start gap-2">
                            <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                            Network and location checks run server-side, so off-site check-ins are
                            rejected automatically.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AttendanceSettings.layout = {
    breadcrumbs: [{ title: 'Attendance settings', href: '/settings/attendance' }],
};
