import { Head } from '@inertiajs/react';

export default function PrivacyPage() {
    return (
        <>
            <Head title="Privacy policy" />
            <article className="prose prose-neutral mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20 dark:prose-invert">
                <h1>Privacy policy</h1>
                <p className="lead">Last updated: September 8, 2026</p>
                <p>
                    Attendrly (“we”, “us”) provides a multi-tenant attendance and leave management
                    platform. This policy explains how we handle information when you use our website
                    and product.
                </p>
                <h2>Information we process</h2>
                <p>
                    Depending on how you use Attendrly, we may process account details, company
                    workspace information, employee records you enter, attendance and leave data,
                    billing details, and technical logs needed to operate the service securely.
                </p>
                <h2>How we use information</h2>
                <p>
                    We use information to provide and improve the product, authenticate users, enforce
                    tenant isolation and permissions, process subscriptions, communicate service
                    updates, and maintain security and reliability.
                </p>
                <h2>Tenant data</h2>
                <p>
                    Customer workspace data is isolated per tenant. Your organization remains
                    responsible for the employee and operational data it stores in Attendrly.
                </p>
                <h2>Contact</h2>
                <p>
                    For privacy questions, contact{' '}
                    <a href="mailto:privacy@softrly.com">privacy@softrly.com</a>.
                </p>
            </article>
        </>
    );
}
