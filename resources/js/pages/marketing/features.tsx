import { Head, Link } from '@inertiajs/react';
import { Building2, CalendarDays, Clock3, FileSpreadsheet, Network, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { register } from '@/routes';

const sections = [
    {
        icon: Clock3,
        title: 'Attendance',
        body: 'Daily check-in and check-out with shift context, late tracking, and clear status for every employee.',
        points: ['Today’s attendance card', 'Working hours and shift', 'Friendly office network status'],
    },
    {
        icon: Users,
        title: 'Employee management',
        body: 'Keep people data organized with departments, designations, offices, and employment status.',
        points: ['Employee profiles', 'Search and filters', 'Role-aware access'],
    },
    {
        icon: CalendarDays,
        title: 'Leave management',
        body: 'Request, approve, and track leave with balances and calendars that stay in sync with attendance.',
        points: ['Leave requests and approvals', 'Leave types and balances', 'Attachments when required'],
    },
    {
        icon: Network,
        title: 'Office networks',
        body: 'Restrict attendance to approved office networks without showing technical IP details to employees.',
        points: ['Public IP / CIDR setup', 'Active / inactive status', 'Clear employee messaging'],
    },
    {
        icon: Building2,
        title: 'Shifts, working days & holidays',
        body: 'Configure how your company works week to week, then let attendance and leave follow the rules.',
        points: ['Shift schedules', 'Weekly working days', 'Company holidays'],
    },
    {
        icon: FileSpreadsheet,
        title: 'Reports & exports',
        body: 'Operational reports for attendance, leave, and salary when your plan unlocks them.',
        points: ['Date and office filters', 'CSV export where available', 'Manager-ready summaries'],
    },
];

export default function FeaturesPage() {
    return (
        <>
            <Head title="Features">
                <meta
                    head-key="description"
                    name="description"
                    content="Explore Attendrly features for attendance, leave, employees, offices, shifts, and workforce reporting."
                />
            </Head>
            <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
                <div className="max-w-2xl">
                    <p className="text-primary text-sm font-medium">Product</p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight">Built for daily workforce operations</h1>
                    <p className="text-muted-foreground mt-4 text-base leading-7">
                        Attendrly focuses on the workflows HR and managers actually use: attendance, leave,
                        people data, offices, and reporting.
                    </p>
                </div>
                <div className="mt-12 grid gap-5 lg:grid-cols-2">
                    {sections.map((section) => (
                        <article key={section.title} className="bg-card rounded-2xl border p-6">
                            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                                <section.icon className="size-5" />
                            </div>
                            <h2 className="mt-4 text-xl font-semibold">{section.title}</h2>
                            <p className="text-muted-foreground mt-2 text-sm leading-6">{section.body}</p>
                            <ul className="mt-4 space-y-2 text-sm">
                                {section.points.map((point) => (
                                    <li key={point} className="text-foreground/90">
                                        · {point}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
                <div className="mt-14 flex flex-wrap gap-3">
                    <Button asChild>
                        <Link href={register()}>Start free trial</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/pricing">Compare plans</Link>
                    </Button>
                </div>
            </section>
        </>
    );
}
