import { Form, Head } from '@inertiajs/react';
import { CalendarCheck } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
            <PageShell>
                <PageHeader
                    title="Working days"
                    description="Leave and attendance calendars skip days that are not working days."
                />

                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Weekly schedule</CardTitle>
                        <CardDescription>
                            Uncheck a day to treat it as a weekly off for the whole workspace.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form action="/working-days" method="put" className="space-y-4">
                            {({ processing }) => (
                                <>
                                    <div className="space-y-3">
                                        {days.map((day, index) => (
                                            <div
                                                key={day.day_of_week}
                                                className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5"
                                            >
                                                <input
                                                    type="hidden"
                                                    name={`days[${index}][day_of_week]`}
                                                    value={day.day_of_week}
                                                />
                                                <input
                                                    type="hidden"
                                                    name={`days[${index}][is_working]`}
                                                    value="0"
                                                />
                                                <input
                                                    id={`day-${day.day_of_week}`}
                                                    type="checkbox"
                                                    name={`days[${index}][is_working]`}
                                                    value="1"
                                                    defaultChecked={day.is_working}
                                                    className="accent-primary size-4 rounded border"
                                                />
                                                <Label
                                                    htmlFor={`day-${day.day_of_week}`}
                                                    className="flex flex-1 items-center justify-between font-medium"
                                                >
                                                    {day.label}
                                                    {!day.is_working ? (
                                                        <span className="text-muted-foreground text-xs font-normal">
                                                            Weekly off
                                                        </span>
                                                    ) : null}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                    <Button type="submit" disabled={processing}>
                                        <CalendarCheck className="size-4" />
                                        Save working week
                                    </Button>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            </PageShell>
        </>
    );
}

WorkingDaysIndex.layout = {
    breadcrumbs: [
        { title: 'Settings', href: '/settings/attendance' },
        { title: 'Working days', href: '/working-days' },
    ],
};
