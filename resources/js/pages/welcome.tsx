import { Head, Link, usePage } from '@inertiajs/react';
import { login } from '@/routes';
import { register } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Office Network Attendance SaaS" />
            <div className="min-h-screen bg-[#F6F7F4] text-[#1B1B18]">
                <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
                    <div className="text-lg font-semibold tracking-tight">
                        Softrly Attendance
                    </div>
                    <nav className="flex items-center gap-3 text-sm">
                        {auth.user ? (
                            <Link
                                href="/dashboard"
                                className="rounded-full bg-[#1B1B18] px-4 py-2 text-white"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/pricing" className="px-3 py-2">
                                    Pricing
                                </Link>
                                <Link href={login()} className="px-3 py-2">
                                    Log in
                                </Link>
                                <Link
                                    href={register()}
                                    className="rounded-full bg-[#1B1B18] px-4 py-2 text-white"
                                >
                                    Start free trial
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <main className="mx-auto max-w-6xl px-6 pb-20">
                    <section className="grid gap-10 py-16 lg:grid-cols-2 lg:items-center">
                        <div>
                            <p className="mb-4 text-sm font-medium tracking-wide text-[#5C7A4A] uppercase">
                                Multi-tenant HR SaaS
                            </p>
                            <h1 className="max-w-xl text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
                                Attendance that only works on an authorized office network.
                            </h1>
                            <p className="mt-5 max-w-xl text-base leading-7 text-[#5F5E5A]">
                                Employees can log in, apply leave, and view reports from anywhere.
                                Check-in and check-out stay locked to each tenant’s approved office
                                IPs — across every branch.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href={register()}
                                    className="rounded-full bg-[#1B1B18] px-5 py-2.5 text-sm text-white"
                                >
                                    Start 14-day trial
                                </Link>
                                <Link
                                    href="/pricing"
                                    className="rounded-full border border-[#1B1B18]/15 px-5 py-2.5 text-sm"
                                >
                                    View pricing
                                </Link>
                            </div>
                        </div>
                        <div className="rounded-3xl border border-[#1B1B18]/10 bg-white p-6 shadow-sm">
                            <div className="mb-4 text-sm text-[#5F5E5A]">
                                Today · Dhaka Head Office
                            </div>
                            <div className="rounded-2xl bg-[#F6F7F4] p-5">
                                <div className="text-sm">Status</div>
                                <div className="mt-1 text-2xl font-semibold">
                                    Office network detected
                                </div>
                                <div className="mt-4 text-sm text-[#5F5E5A]">
                                    103.42.10.10 · General Shift 09:00 – 18:00
                                </div>
                                <div className="mt-6 inline-flex rounded-full bg-[#1B1B18] px-4 py-2 text-sm text-white">
                                    Check In
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-6 md:grid-cols-3">
                        {[
                            {
                                title: 'Network-first attendance',
                                body: 'Laravel verifies the public client IP against each office’s approved static IP or CIDR range.',
                            },
                            {
                                title: 'Multi-office tenants',
                                body: 'Dhaka, Uttara, Chittagong — each branch keeps its own networks, timezone, and attendance trail.',
                            },
                            {
                                title: 'Anywhere else still works',
                                body: 'Leave, dashboards, history, and profile stay available from home Wi-Fi or mobile data.',
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="rounded-2xl border border-[#1B1B18]/10 bg-white p-6"
                            >
                                <h2 className="font-medium">{item.title}</h2>
                                <p className="mt-2 text-sm leading-6 text-[#5F5E5A]">
                                    {item.body}
                                </p>
                            </div>
                        ))}
                    </section>
                </main>
            </div>
        </>
    );
}
