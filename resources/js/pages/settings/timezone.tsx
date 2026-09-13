import { Form, Head } from '@inertiajs/react';
import { Clock3, Globe, MonitorSmartphone } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';

type Zone = { value: string; label: string; offset: string };
type Group = { region: string; zones: Zone[] };

type Props = {
    timezone: string;
    now: string;
    offset: string;
    timezones: Group[];
};

export default function TimezoneSettings({
    timezone,
    now,
    offset,
    timezones,
}: Props) {
    const [selected, setSelected] = useState(timezone);
    const [region, setRegion] = useState<string>(() => {
        const current = timezones.find((group) =>
            group.zones.some((zone) => zone.value === timezone),
        );

        return current?.region ?? timezones[0]?.region ?? '';
    });

    const zones = useMemo(
        () => timezones.find((group) => group.region === region)?.zones ?? [],
        [timezones, region],
    );

    const deviceZone = useMemo(() => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
        } catch {
            return '';
        }
    }, []);

    const deviceIsDifferent = deviceZone !== '' && deviceZone !== timezone;

    return (
        <>
            <Head title="Time zone" />
            <div>
                <div>
                    <h2 className="text-lg font-semibold">Time zone</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Attendance times, late minutes and work hours are all
                        recorded in this zone. Changing it affects new records
                        only.
                    </p>
                </div>

                <Card className="mt-5 max-w-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Globe className="size-4" />
                            Workspace time zone
                        </CardTitle>
                        <CardDescription>
                            Currently{' '}
                            <span className="font-medium">{timezone}</span> (
                            {offset}) — the workspace clock reads {now}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form
                            action="/settings/timezone"
                            method="put"
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="tz-region">
                                                Region
                                            </Label>
                                            <select
                                                id="tz-region"
                                                value={region}
                                                onChange={(event) => {
                                                    const next =
                                                        event.target.value;
                                                    setRegion(next);

                                                    const first =
                                                        timezones.find(
                                                            (group) =>
                                                                group.region ===
                                                                next,
                                                        )?.zones[0];

                                                    if (first) {
                                                        setSelected(
                                                            first.value,
                                                        );
                                                    }
                                                }}
                                                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                                            >
                                                {timezones.map((group) => (
                                                    <option
                                                        key={group.region}
                                                        value={group.region}
                                                    >
                                                        {group.region}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="timezone">
                                                City / time zone
                                            </Label>
                                            <select
                                                id="timezone"
                                                name="timezone"
                                                value={selected}
                                                onChange={(event) =>
                                                    setSelected(
                                                        event.target.value,
                                                    )
                                                }
                                                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                                            >
                                                {zones.map((zone) => (
                                                    <option
                                                        key={zone.value}
                                                        value={zone.value}
                                                    >
                                                        {zone.label} (
                                                        {zone.offset})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {errors.timezone ? (
                                        <p className="text-destructive text-sm">
                                            {errors.timezone}
                                        </p>
                                    ) : null}

                                    {deviceIsDifferent ? (
                                        <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                                            <div className="flex items-start gap-2 text-sm">
                                                <MonitorSmartphone className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                                <span>
                                                    This device is set to{' '}
                                                    <span className="font-medium">
                                                        {deviceZone}
                                                    </span>
                                                    .
                                                </span>
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelected(deviceZone);

                                                    const group =
                                                        timezones.find((item) =>
                                                            item.zones.some(
                                                                (zone) =>
                                                                    zone.value ===
                                                                    deviceZone,
                                                            ),
                                                        );

                                                    if (group) {
                                                        setRegion(group.region);
                                                    }
                                                }}
                                            >
                                                Use device zone
                                            </Button>
                                        </div>
                                    ) : null}

                                    <div className="bg-muted/30 flex items-center gap-2 rounded-lg border p-3 text-sm">
                                        <Clock3 className="text-muted-foreground size-4 shrink-0" />
                                        Change this only if the workspace clock
                                        above is wrong. Staff in other countries
                                        still see the workspace time.
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={
                                            processing || selected === timezone
                                        }
                                    >
                                        Save time zone
                                    </Button>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

TimezoneSettings.layout = {
    breadcrumbs: [
        { title: 'Settings', href: '/settings' },
        { title: 'Time zone', href: '/settings/timezone' },
    ],
};
