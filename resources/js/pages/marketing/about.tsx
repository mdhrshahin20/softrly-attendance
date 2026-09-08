import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { register } from '@/routes';

export default function AboutPage() {
    return (
        <>
            <Head title="About">
                <meta
                    head-key="description"
                    name="description"
                    content="Softrly is a multi-tenant attendance and leave management platform for modern companies."
                />
            </Head>
            <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
                <p className="text-primary text-sm font-medium">Company</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">About Softrly</h1>
                <div className="text-muted-foreground mt-6 space-y-4 text-base leading-7">
                    <p>
                        Softrly is an attendance and leave management SaaS for companies that need clear
                        daily operations — not another bloated HR suite.
                    </p>
                    <p>
                        We focus on multi-tenant workspaces, office-aware attendance, leave approvals,
                        and the organizational basics that keep teams moving: employees, departments,
                        offices, shifts, holidays, and reports.
                    </p>
                    <p>
                        The product is designed to feel calm and professional for owners, HR, managers,
                        and employees alike.
                    </p>
                </div>
                <div className="mt-10 flex flex-wrap gap-3">
                    <Button asChild>
                        <Link href={register()}>Start free trial</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/contact">Contact us</Link>
                    </Button>
                </div>
            </section>
        </>
    );
}
