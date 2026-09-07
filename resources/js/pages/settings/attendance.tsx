import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

type Mode = {
    value: string;
    label: string;
    description: string;
    requires_location: boolean;
};

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
            <div className="flex flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Attendance mode</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Choose how employees prove they are at work. Location modes need the Professional location add-on (Enterprise includes it).
                    </p>
                </div>
                <Form action="/settings/attendance" method="put" className="max-w-2xl space-y-4">
                    {({ processing, errors }) => (
                        <>
                            {modes.map((item) => (
                                <label key={item.value} className="flex cursor-pointer gap-3 rounded-xl border p-4">
                                    <input
                                        type="radio"
                                        name="attendance_method"
                                        value={item.value}
                                        defaultChecked={mode === item.value}
                                        disabled={item.requires_location && !canUseLocation}
                                        className="mt-1"
                                    />
                                    <div>
                                        <div className="font-medium">{item.label}</div>
                                        <p className="text-muted-foreground text-sm">{item.description}</p>
                                        {item.requires_location && !canUseLocation && (
                                            <p className="text-destructive mt-1 text-xs">Upgrade to Enterprise for location attendance.</p>
                                        )}
                                    </div>
                                </label>
                            ))}
                            {errors.attendance_method && (
                                <p className="text-destructive text-sm">{errors.attendance_method}</p>
                            )}
                            {errors.plan && <p className="text-destructive text-sm">{errors.plan}</p>}
                            <Button type="submit" disabled={processing}>
                                Save attendance mode
                            </Button>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

AttendanceSettings.layout = {
    breadcrumbs: [{ title: 'Attendance settings', href: '/settings/attendance' }],
};
