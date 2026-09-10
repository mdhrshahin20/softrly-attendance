import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    Clock3,
    FileSpreadsheet,
    Network,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { register } from '@/routes';

const features = [
    {
        icon: Clock3,
        title: 'Attendance',
        body: 'Check-in and check-out with clear status, shift context, and office awareness.',
    },
    {
        icon: Users,
        title: 'Employee management',
        body: 'Profiles, departments, designations, and employment status in one place.',
    },
    {
        icon: CalendarDays,
        title: 'Leave management',
        body: 'Requests, approvals, balances, and calendars without spreadsheet chaos.',
    },
    {
        icon: Network,
        title: 'Office networks',
        body: 'Limit attendance to approved office networks without exposing technical detail to staff.',
    },
    {
        icon: Building2,
        title: 'Shifts & offices',
        body: 'Configure branches, shifts, working days, and holidays for every team.',
    },
    {
        icon: FileSpreadsheet,
        title: 'Reports',
        body: 'Attendance, leave, and workforce reporting ready for export when you need it.',
    },
];

const steps = [
    'Create your company workspace',
    'Add employees and roles',
    'Configure offices and networks',
    'Set shifts and working days',
    'Start managing attendance and leave',
];

const faqs = [
    {
        q: 'Can employees check in from home?',
        a: 'Employees can log in from anywhere, but check-in and check-out can be restricted to approved office networks depending on your attendance mode.',
    },
    {
        q: 'Is Attendrly multi-tenant?',
        a: 'Yes. Each company gets an isolated workspace with its own employees, offices, leave data, and subscription.',
    },
    {
        q: 'Do you support multiple offices?',
        a: 'Yes. Add branches, assign employees, and configure network or location rules per office based on your plan.',
    },
    {
        q: 'How does pricing work?',
        a: 'Plans are based on employee and office limits, with a free trial to get started. Upgrade any time from Billing.',
    },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border-b last:border-b-0">
            <button
                type="button"
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                {question}
                <ChevronDown className={cn('text-muted-foreground size-4 shrink-0 transition-transform', open && 'rotate-180')} />
            </button>
            {open ? <p className="text-muted-foreground pb-4 text-sm leading-6">{answer}</p> : null}
        </div>
    );
}

function ProductPreview() {
    return (
        <div className="bg-card relative overflow-hidden rounded-2xl border shadow-sm">
            <div className="border-b px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-rose-400" />
                    <span className="size-2.5 rounded-full bg-amber-400" />
                    <span className="size-2.5 rounded-full bg-emerald-400" />
                    <span className="text-muted-foreground ml-2 text-xs">softrly.app / dashboard</span>
                </div>
            </div>
            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_0.9fr]">
                <div className="space-y-3">
                    <div className="rounded-xl border bg-muted/40 p-4">
                        <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                            Today’s attendance
                        </div>
                        <div className="mt-2 text-lg font-semibold">Office network connected</div>
                        <p className="text-muted-foreground mt-1 text-sm">General Shift · 09:00 – 18:00</p>
                        <div className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                            Check in
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            ['Present', '42'],
                            ['Late', '3'],
                            ['On leave', '5'],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-xl border p-3">
                                <div className="text-muted-foreground text-[11px]">{label}</div>
                                <div className="mt-1 text-lg font-semibold">{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-xl border p-4">
                    <div className="text-sm font-medium">Leave queue</div>
                    <div className="mt-3 space-y-2">
                        {[
                            ['Amina Rahman', 'Casual · 2 days', 'Pending'],
                            ['Nadia Islam', 'Sick · 1 day', 'Approved'],
                            ['Karim Hossain', 'Annual · 3 days', 'Pending'],
                        ].map(([name, detail, status]) => (
                            <div key={name} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
                                <div>
                                    <div className="text-sm font-medium">{name}</div>
                                    <div className="text-muted-foreground text-xs">{detail}</div>
                                </div>
                                <span
                                    className={cn(
                                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                                        status === 'Approved'
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-amber-50 text-amber-800',
                                    )}
                                >
                                    {status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Attendance & leave for modern teams">
                <meta
                    head-key="description"
                    name="description"
                    content="Attendrly helps companies manage employees, attendance, leave, offices, and workforce operations from one simple platform."
                />
            </Head>

            <section className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.94_0.03_277),transparent_55%)]" />
                <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
                    <div>
                        <p className="text-primary mb-4 text-sm font-medium tracking-wide">
                            Built for growing teams
                        </p>
                        <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                            Attendance and leave management, built for modern teams.
                        </h1>
                        <p className="text-muted-foreground mt-5 max-w-xl text-base leading-7 text-pretty">
                            Manage employees, attendance, leave, offices and workforce operations from one
                            simple platform.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button size="lg" asChild>
                                <Link href={auth.user ? '/dashboard' : register()}>
                                    {auth.user ? 'Open dashboard' : 'Start free trial'}
                                    <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild>
                                <Link href="/features">See how it works</Link>
                            </Button>
                        </div>
                        <div className="text-muted-foreground mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2 className="text-primary size-4" /> Multi-tenant workspaces
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2 className="text-primary size-4" /> Role-based access
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2 className="text-primary size-4" /> Office-aware attendance
                            </span>
                        </div>
                    </div>
                    <ProductPreview />
                </div>
            </section>

            <section className="border-y bg-muted/20">
                <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                    <p className="text-muted-foreground text-center text-sm">
                        Trusted by operations, HR, and team leads who need clarity every morning.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
                <div className="max-w-2xl">
                    <h2 className="text-3xl font-semibold tracking-tight">Everything your workforce ops need</h2>
                    <p className="text-muted-foreground mt-3 text-base leading-7">
                        One product for attendance, people data, leave, offices, and reporting — without a
                        cluttered admin panel.
                    </p>
                </div>
                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                        <div key={feature.title} className="bg-card rounded-2xl border p-5 transition-shadow hover:shadow-sm">
                            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                                <feature.icon className="size-5" />
                            </div>
                            <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                            <p className="text-muted-foreground mt-2 text-sm leading-6">{feature.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-muted/25">
                <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
                    <div>
                        <h2 className="text-3xl font-semibold tracking-tight">Attendance that respects your offices</h2>
                        <p className="text-muted-foreground mt-3 text-base leading-7">
                            Make attendance available only from approved office networks. Employees see a
                            clear, friendly status — never raw IP configuration.
                        </p>
                        <ul className="mt-6 space-y-3 text-sm">
                            {[
                                'Check in and check out in one action',
                                'Shift and office context on every record',
                                'Friendly network status for employees',
                                'Admin controls for offices and networks',
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-2">
                                    <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-card rounded-2xl border p-6">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                                <ShieldCheck className="size-5" />
                            </div>
                            <div>
                                <div className="font-medium">You’re connected to an approved office network</div>
                                <div className="text-muted-foreground text-sm">Dhaka Head Office · General Shift</div>
                            </div>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl border p-3">
                                <div className="text-muted-foreground text-xs">Status</div>
                                <div className="mt-1 font-medium">Ready to check in</div>
                            </div>
                            <div className="rounded-xl border p-3">
                                <div className="text-muted-foreground text-xs">Working hours</div>
                                <div className="mt-1 font-medium">09:00 – 18:00</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
                <div className="max-w-2xl">
                    <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
                    <p className="text-muted-foreground mt-3 text-base leading-7">
                        Get from signup to daily operations in a few clear steps.
                    </p>
                </div>
                <ol className="mt-10 grid gap-4 md:grid-cols-5">
                    {steps.map((step, index) => (
                        <li key={step} className="bg-card rounded-2xl border p-4">
                            <div className="text-primary text-sm font-semibold">0{index + 1}</div>
                            <p className="mt-3 text-sm font-medium leading-6">{step}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="border-y bg-muted/20">
                <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
                    <div>
                        <h2 className="text-3xl font-semibold tracking-tight">Security by design</h2>
                        <p className="text-muted-foreground mt-3 text-base leading-7">
                            Tenant isolation, role-based permissions, secure authentication, and audit
                            visibility for sensitive actions.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {[
                            'Tenant isolation',
                            'Role-based access',
                            'Secure authentication',
                            'Permission-aware UI',
                            'Audit activity',
                            'Subscription controls',
                        ].map((item) => (
                            <div key={item} className="bg-card flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium">
                                <ShieldCheck className="text-primary size-4" />
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
                <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                    <div>
                        <h2 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
                        <p className="text-muted-foreground mt-3 text-base leading-7">
                            Straight answers for HR and operations teams evaluating Attendrly.
                        </p>
                    </div>
                    <div className="bg-card rounded-2xl border px-5">
                        {faqs.map((item) => (
                            <FaqItem key={item.q} question={item.q} answer={item.a} />
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
                <div className="from-primary to-primary/80 relative overflow-hidden rounded-3xl bg-gradient-to-br px-6 py-12 text-primary-foreground sm:px-10">
                    <div className="relative max-w-xl">
                        <h2 className="text-3xl font-semibold tracking-tight">Ready to simplify workforce management?</h2>
                        <p className="mt-3 text-sm leading-6 text-primary-foreground/85">
                            Start your free trial, invite your team, and run attendance and leave from one
                            calm workspace.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button size="lg" variant="secondary" asChild>
                                <Link href={auth.user ? '/dashboard' : register()}>
                                    {auth.user ? 'Go to dashboard' : 'Start free trial'}
                                </Link>
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                                asChild
                            >
                                <Link href="/pricing">View pricing</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
