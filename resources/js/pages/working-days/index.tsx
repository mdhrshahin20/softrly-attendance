import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type Day = {
    day_of_week: number;
    label: string;
    is_working: boolean;
};

export default function WorkingDaysIndex({ days }: { days: Day[] }) {
    return (
        <>
            <Head title="Working days" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
                <div>
                    <h1 className="text-2xl font-semibold">Working days</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Leave and attendance calendars skip days that are not working days.
                    </p>
                </div>
                <Form action="/working-days" method="put" className="max-w-md space-y-4">
                    {days.map((day, index) => (
                        <div key={day.day_of_week} className="flex items-center gap-3">
                            <input type="hidden" name={`days[${index}][day_of_week]`} value={day.day_of_week} />
                            <input type="hidden" name={`days[${index}][is_working]`} value="0" />
                            <input
                                id={`day-${day.day_of_week}`}
                                type="checkbox"
                                name={`days[${index}][is_working]`}
                                value="1"
                                defaultChecked={day.is_working}
                                className="size-4 rounded border"
                            />
                            <Label htmlFor={`day-${day.day_of_week}`}>{day.label}</Label>
                        </div>
                    ))}
                    <Button type="submit">Save working week</Button>
                </Form>
            </div>
        </>
    );
}

WorkingDaysIndex.layout = {
    breadcrumbs: [{ title: 'Working days', href: '/working-days' }],
};
