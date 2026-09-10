import { Head, Link, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { register } from '@/routes';

type Plan = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    employee_limit_label: string;
    office_limit_label: string;
    monthly_price: number;
    yearly_price: number;
    currency: string;
    trial_days: number;
    feature_labels: string[];
};

export default function Pricing({ plans }: { plans: Plan[] }) {
    const { auth } = usePage().props;
    const [yearly, setYearly] = useState(false);

    const recommended = useMemo(() => {
        const growth = plans.find((plan) => plan.slug.includes('growth') || plan.slug.includes('professional'));
        return growth?.id ?? plans[1]?.id ?? plans[0]?.id;
    }, [plans]);

    return (
        <>
            <Head title="Pricing">
                <meta
                    head-key="description"
                    name="description"
                    content="Simple Attendrly pricing for attendance and leave management. Start with a free trial, then pick a plan."
                />
            </Head>
            <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-primary text-sm font-medium">Pricing</p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight">Simple plans for growing teams</h1>
                    <p className="text-muted-foreground mt-4 text-base leading-7">
                        Start with a free trial. Employee and office limits are enforced per workspace.
                        Upgrade any time from Billing.
                    </p>
                    <div className="mt-8 inline-flex items-center gap-2 rounded-full border bg-card p-1 text-sm">
                        <button
                            type="button"
                            className={cn(
                                'rounded-full px-4 py-1.5 transition-colors',
                                !yearly ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                            )}
                            onClick={() => setYearly(false)}
                        >
                            Monthly
                        </button>
                        <button
                            type="button"
                            className={cn(
                                'rounded-full px-4 py-1.5 transition-colors',
                                yearly ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                            )}
                            onClick={() => setYearly(true)}
                        >
                            Yearly
                        </button>
                    </div>
                    {yearly ? (
                        <p className="text-muted-foreground mt-3 text-sm">Save with yearly billing on eligible plans.</p>
                    ) : null}
                </div>

                <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {plans.map((plan) => {
                        const isRecommended = plan.id === recommended;
                        const price = yearly ? plan.yearly_price : plan.monthly_price;
                        const period = yearly ? 'year' : 'month';

                        return (
                            <div
                                key={plan.id}
                                className={cn(
                                    'bg-card relative flex flex-col rounded-2xl border p-6',
                                    isRecommended && 'border-primary shadow-sm ring-1 ring-primary/20',
                                )}
                            >
                                {isRecommended ? (
                                    <span className="bg-primary text-primary-foreground absolute -top-3 left-6 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                                        Recommended
                                    </span>
                                ) : null}
                                <h2 className="text-xl font-semibold">{plan.name}</h2>
                                <p className="text-muted-foreground mt-2 min-h-12 text-sm leading-6">
                                    {plan.description || 'Built for your team size and operations.'}
                                </p>
                                <div className="mt-6">
                                    <div className="text-3xl font-semibold tracking-tight">
                                        {price === 0 ? 'Custom' : `৳${price.toLocaleString()}`}
                                    </div>
                                    <div className="text-muted-foreground mt-1 text-sm">
                                        {price === 0 ? 'Talk to us' : `per ${period}`}
                                    </div>
                                </div>
                                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                                    <li className="flex gap-2">
                                        <Check className="text-primary mt-0.5 size-4 shrink-0" />
                                        {plan.employee_limit_label}
                                    </li>
                                    <li className="flex gap-2">
                                        <Check className="text-primary mt-0.5 size-4 shrink-0" />
                                        {plan.office_limit_label}
                                    </li>
                                    {plan.feature_labels.slice(0, 6).map((feature) => (
                                        <li key={feature} className="flex gap-2">
                                            <Check className="text-primary mt-0.5 size-4 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button className="mt-8" variant={isRecommended ? 'default' : 'outline'} asChild>
                                    <Link
                                        href={
                                            auth.user
                                                ? '/billing'
                                                : `/register?utm_source=pricing&utm_campaign=${plan.slug}`
                                        }
                                    >
                                        {auth.user
                                            ? 'Manage billing'
                                            : price === 0
                                              ? 'Contact sales'
                                              : `Start ${plan.trial_days}-day trial`}
                                    </Link>
                                </Button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 text-center">
                    <Button variant="ghost" asChild>
                        <Link href={register()}>Create your workspace</Link>
                    </Button>
                </div>
            </section>
        </>
    );
}
