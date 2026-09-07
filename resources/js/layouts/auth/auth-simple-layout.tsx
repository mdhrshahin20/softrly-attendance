import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-6 md:p-10">
            <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.44_0.16_277_/_0.08),transparent_55%)]"
                aria-hidden="true"
            />
            <div className="relative w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link href={home()} className="flex flex-col items-center gap-3">
                            <div className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl">
                                <AppLogoIcon className="size-5" />
                            </div>
                            <span className="text-sm font-semibold tracking-tight">Softrly</span>
                            <span className="sr-only">{title}</span>
                        </Link>
                        <div className="space-y-1.5 text-center">
                            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                            <p className="text-muted-foreground text-sm">{description}</p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
