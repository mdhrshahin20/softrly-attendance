import { Link, usePage } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { SoftrlyLogo } from '@/components/brand/softrly-logo';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="grid min-h-dvh lg:grid-cols-2">
            <div className="relative hidden overflow-hidden bg-[oklch(0.28_0.06_277)] text-white lg:flex lg:flex-col lg:justify-between lg:p-10">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.45_0.14_277_/_0.55),transparent_55%)]" />
                <div className="relative">
                    <SoftrlyLogo href={home()} tone="inverse" variant="compact" label={name || 'Softrly'} />
                </div>
                <div className="relative max-w-md space-y-6">
                    <h2 className="text-3xl font-semibold tracking-tight text-balance">
                        Workforce operations, without the noise.
                    </h2>
                    <p className="text-sm leading-6 text-white/75">
                        Attendance, leave, offices, and people data in one calm workspace for modern teams.
                    </p>
                    <ul className="space-y-3 text-sm text-white/85">
                        {[
                            'Office-aware check-in for employees',
                            'Leave approvals and balances',
                            'Multi-tenant company workspaces',
                        ].map((item) => (
                            <li key={item} className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-white/90" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="relative text-xs text-white/50">© {new Date().getFullYear()} Softrly</p>
            </div>

            <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
                <div className="mb-8 flex justify-center lg:hidden">
                    <SoftrlyLogo href={home()} variant="compact" />
                </div>
                <div className="mx-auto w-full max-w-[400px]">
                    <div className="mb-8 space-y-2 text-center sm:text-left">
                        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                        {description ? (
                            <p className="text-muted-foreground text-sm leading-6">{description}</p>
                        ) : null}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
