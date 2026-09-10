import { Link } from '@inertiajs/react';
import { AttendrlyLogo } from '@/components/brand/attendrly-logo';

const columns = [
    {
        title: 'Product',
        links: [
            { href: '/features', label: 'Features' },
            { href: '/pricing', label: 'Pricing' },
            { href: '/register', label: 'Start trial' },
            { href: '/login', label: 'Log in' },
        ],
    },
    {
        title: 'Company',
        links: [
            { href: '/about', label: 'About' },
            { href: '/contact', label: 'Contact' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { href: '/privacy', label: 'Privacy' },
            { href: '/terms', label: 'Terms' },
        ],
    },
];

export function SiteFooter() {
    return (
        <footer className="border-t bg-muted/30">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_repeat(3,1fr)]">
                <div>
                    <AttendrlyLogo variant="compact" />
                    <p className="text-muted-foreground mt-4 max-w-xs text-sm leading-6">
                        Attendance and leave management for modern teams — office-aware,
                        multi-tenant, and built for day-to-day operations.
                    </p>
                </div>
                {columns.map((column) => (
                    <div key={column.title}>
                        <h3 className="text-sm font-semibold">{column.title}</h3>
                        <ul className="mt-4 space-y-2.5">
                            {column.links.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="border-t">
                <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p>© {new Date().getFullYear()} Attendrly. All rights reserved.</p>
                    <p>Built for growing companies that take attendance seriously.</p>
                </div>
            </div>
        </footer>
    );
}
