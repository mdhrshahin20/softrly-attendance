import { Head, Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { login } from '@/routes';
import { register } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Softrly Attendance" />
            <div className="bg-background text-foreground min-h-screen">
                <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                            <AppLogoIcon className="size-4" />
                        </div>
                        <span className="text-sm font-semibold tracking-tight">Softrly</span>
                    </Link>
                    <nav className="flex items-center gap-3 text-sm">
                        {auth.user ? (
                            <Link
                                href="/dashboard"
                                className="bg-primary text-primary-foreground rounded-lg px-4 py-2"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/pricing" className="text-muted-foreground hover:text-foreground px-3 py-2">
                                    Pricing
                                </Link>
                                <Link href={login()} className="text-muted-foreground hover:text-foreground px-3 py-2">
                                    Log in
                                </Link>
                                <Link
                                    href={register()}
                                    className="bg-primary text-primary-foreground rounded-lg px-4 py-2"
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
                            <p className="text-primary mb-4 text-sm font-medium tracking-wide uppercase">
                                Multi-tenant HR SaaS
                            </p>
                            <h1 className="max-w-xl text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
                                Attendance that only works on an authorized office network.
                            </h1>
                            <p className="text-muted-foreground mt-5 max-w-xl text-base leading-7">
                                Employees can log in, apply leave, and view reports from anywhere.
                                Check-in and check-out stay locked to each tenant’s approved office
                                IPs — across every branch.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href={register()}
                                    className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm"
                                >
                                    Start 14-day trial
                                </Link>
                                <Link
                                    href="/pricing"
                                    className="border-border rounded-lg border px-5 py-2.5 text-sm"
                                >
                                    View pricing
                                </Link>
                            </div>
                        </div>
                        <div className="bg-card rounded-2xl border p-6">
                            <div className="text-muted-foreground mb-4 text-sm">Today · Dhaka Head Office</div>
                            <div className="bg-muted/60 rounded-xl p-5">
                                <div className="text-muted-foreground text-sm">Status</div>
                                <div className="mt-1 text-2xl font-semibold">Office network connected</div>
                                <div className="text-muted-foreground mt-4 text-sm">
                                    General Shift 09:00 – 18:00
                                </div>
                                <div className="bg-primary text-primary-foreground mt-6 inline-flex rounded-lg px-4 py-2 text-sm">
                                    Check in
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
                            <div key={item.title} className="bg-card rounded-2xl border p-6">
                                <h2 className="font-medium">{item.title}</h2>
                                <p className="text-muted-foreground mt-2 text-sm leading-6">{item.body}</p>
                            </div>
                        ))}
                    </section>
                </main>
            </div>
        </>
    );
}
