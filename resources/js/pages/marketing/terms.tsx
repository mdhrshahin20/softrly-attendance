import { Head } from '@inertiajs/react';

export default function TermsPage() {
    return (
        <>
            <Head title="Terms of service" />
            <article className="prose prose-neutral mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20 dark:prose-invert">
                <h1>Terms of service</h1>
                <p className="lead">Last updated: September 8, 2026</p>
                <p>
                    These terms govern access to Softrly’s website and multi-tenant SaaS platform. By
                    creating an account or using the service, you agree to these terms.
                </p>
                <h2>Accounts and workspaces</h2>
                <p>
                    You must provide accurate registration information and keep credentials secure.
                    Workspace owners are responsible for users invited into their tenant and for
                    complying with applicable employment and data laws.
                </p>
                <h2>Subscriptions</h2>
                <p>
                    Paid plans, trial periods, employee limits, and feature entitlements are defined by
                    your selected plan and billing status. Access to certain features may pause when a
                    subscription is inactive.
                </p>
                <h2>Acceptable use</h2>
                <p>
                    You may not misuse the service, attempt unauthorized access, interfere with tenant
                    isolation, or use Softrly for unlawful purposes.
                </p>
                <h2>Contact</h2>
                <p>
                    Questions about these terms: <a href="mailto:legal@softrly.com">legal@softrly.com</a>.
                </p>
            </article>
        </>
    );
}
