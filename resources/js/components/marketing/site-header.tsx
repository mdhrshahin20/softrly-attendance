import { Link, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AttendrlyLogo } from '@/components/brand/attendrly-logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { login, register } from '@/routes';

const nav = [
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
    const { auth, url } = usePage().props as { auth: { user?: unknown }; url?: string };
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const path = typeof window !== 'undefined' ? window.location.pathname : (url ?? '/');

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setOpen(false);
    }, [path]);

    return (
        <header
            className={cn(
                'sticky top-0 z-40 border-b transition-all duration-200',
                scrolled
                    ? 'border-border/80 bg-background/90 shadow-sm backdrop-blur-md'
                    : 'border-transparent bg-background/70 backdrop-blur-sm',
            )}
        >
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
                <AttendrlyLogo variant="full" />

                <nav className="hidden items-center gap-1 md:flex">
                    {nav.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'rounded-lg px-3 py-2 text-sm transition-colors',
                                path === item.href
                                    ? 'bg-accent text-accent-foreground font-medium'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="hidden items-center gap-2 md:flex">
                    {auth.user ? (
                        <Button asChild>
                            <Link href="/dashboard">Dashboard</Link>
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" asChild>
                                <Link href={login()}>Log in</Link>
                            </Button>
                            <Button asChild>
                                <Link href={register()}>Start free trial</Link>
                            </Button>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2 md:hidden">
                    {!auth.user ? (
                        <Button size="sm" asChild>
                            <Link href={register()}>Trial</Link>
                        </Button>
                    ) : null}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-9"
                        onClick={() => setOpen((v) => !v)}
                        aria-label={open ? 'Close menu' : 'Open menu'}
                    >
                        {open ? <X className="size-4" /> : <Menu className="size-4" />}
                    </Button>
                </div>
            </div>

            {open ? (
                <div className="border-t md:hidden">
                    <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
                        {nav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="rounded-lg px-3 py-2.5 text-sm font-medium"
                            >
                                {item.label}
                            </Link>
                        ))}
                        <div className="mt-2 grid gap-2 border-t pt-3">
                            {auth.user ? (
                                <Button asChild>
                                    <Link href="/dashboard">Dashboard</Link>
                                </Button>
                            ) : (
                                <>
                                    <Button variant="outline" asChild>
                                        <Link href={login()}>Log in</Link>
                                    </Button>
                                    <Button asChild>
                                        <Link href={register()}>Start free trial</Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </header>
    );
}
