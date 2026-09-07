import { Head, Link, usePage } from '@inertiajs/react';
import { login, register } from '@/routes';

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

    return (
        <>
            <Head title="Pricing" />
            <div className="min-h-screen bg-[#F6F7F4] text-[#1B1B18]">
                <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
                    <Link href="/" className="text-lg font-semibold tracking-tight">
                        Softrly Attendance
                    </Link>
                    <nav className="flex items-center gap-3 text-sm">
                        {auth.user ? (
                            <Link href="/dashboard" className="rounded-full bg-[#1B1B18] px-4 py-2 text-white">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href={login()} className="px-3 py-2">Log in</Link>
                                <Link href={register()} className="rounded-full bg-[#1B1B18] px-4 py-2 text-white">
                                    Start free trial
                                </Link>
                            </>
                        )}
                    </nav>
                </header>
                <main className="mx-auto max-w-6xl px-6 pb-20">
                    <div className="py-12 text-center">
                        <p className="text-sm font-medium tracking-wide text-[#5C7A4A] uppercase">Simple SaaS pricing</p>
                        <h1 className="mt-3 text-4xl font-semibold tracking-tight">14 days free, then pick a plan.</h1>
                        <p className="mx-auto mt-4 max-w-2xl text-[#5F5E5A]">
                            Employee and office limits are enforced per tenant. Upgrade any time from Billing.
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {plans.map((plan) => (
                            <div key={plan.id} className="flex flex-col rounded-3xl border border-[#1B1B18]/10 bg-white p-6">
                                <h2 className="text-xl font-semibold">{plan.name}</h2>
                                <p className="mt-2 min-h-12 text-sm text-[#5F5E5A]">{plan.description}</p>
                                <div className="mt-6 text-3xl font-semibold">
                                    {plan.monthly_price === 0 ? 'Custom' : `৳${plan.monthly_price.toLocaleString()}`}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                    {plan.monthly_price === 0 ? 'Talk to us' : 'per month · ৳' + plan.yearly_price.toLocaleString() + ' yearly'}
                                </div>
                                <ul className="mt-6 space-y-2 text-sm">
                                    <li>{plan.employee_limit_label}</li>
                                    <li>{plan.office_limit_label}</li>
                                    {plan.feature_labels.map((feature) => (
                                        <li key={feature}>{feature}</li>
                                    ))}
                                </ul>
                                <Link
                                    href={`/register?utm_source=pricing&utm_campaign=${plan.slug}`}
                                    className="mt-8 inline-flex justify-center rounded-full bg-[#1B1B18] px-4 py-2 text-sm text-white"
                                >
                                    Start {plan.trial_days}-day trial
                                </Link>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </>
    );
}
