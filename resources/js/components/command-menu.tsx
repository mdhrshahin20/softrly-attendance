import { router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CornerDownLeft,
    Search,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildNavGroups } from '@/components/nav-groups';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { InertiaLinkProps } from '@inertiajs/react';
import type { NavItem } from '@/types';

type Href = NonNullable<InertiaLinkProps['href']>;

type FlatEntry = { title: string; href: Href; icon?: LucideIcon | null; section: string };

function toEntries(items: NavItem[], section: string): FlatEntry[] {
    return items.map((item) => ({
        title: item.title,
        href: item.href,
        icon: item.icon ?? null,
        section,
    }));
}

export function CommandMenu({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const page = usePage();
    const can = (page.props.can ?? {}) as Record<string, boolean>;
    const unreadNotifications = Number(page.props.unreadNotifications ?? 0);
    const isPlatform = Boolean(can.platform);
    const groups = buildNavGroups({ can, unreadNotifications, isPlatform });
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    const quickActions: FlatEntry[] = isPlatform
        ? []
        : [
              { title: 'Check in today', href: dashboard(), icon: null, section: 'Quick actions' },
              { title: 'Apply for leave', href: '/leave', icon: null, section: 'Quick actions' },
          ];

    const pages: FlatEntry[] = groups.flatMap((group) =>
        toEntries(group.items, group.title),
    );

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) {
            return [...quickActions, ...pages];
        }

        const match = (text: string) => text.toLowerCase().includes(q);

        return [...quickActions, ...pages].filter((entry) => match(entry.title) || match(entry.section));
    }, [query, quickActions, pages]);

    useEffect(() => {
        if (!open) {
            setQuery('');
            setActiveIndex(0);
        }
    }, [open]);

    useEffect(() => setActiveIndex(0), [query]);

    useEffect(() => {
        const el = listRef.current?.querySelector<HTMLElement>(
            `[data-command-index="${activeIndex}"]`,
        );

        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    function go(index: number) {
        const target = results[index];

        if (target) {
            onOpenChange(false);
            router.visit(target.href);
        }
    }

    function onKeyDown(event: React.KeyboardEvent) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, results.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            go(activeIndex);
        }
    }

    let lastSection: string | null = null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="top-[12vh] translate-y-0 gap-0 overflow-hidden rounded-xl p-0 shadow-2xl sm:max-w-[560px]"
                hideClose
                onOpenAutoFocus={(event) => event.preventDefault()}
            >
                <DialogTitle className="sr-only">Quick navigation</DialogTitle>
                <DialogDescription className="sr-only">
                    Search pages and jump to them.
                </DialogDescription>

                <div className="flex items-center gap-2 border-b px-3.5">
                    <Search className="text-muted-foreground size-4 shrink-0" />
                    <Input
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Search pages…"
                        className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0"
                    />
                    <kbd className="bg-muted text-muted-foreground hidden rounded-md px-1.5 py-0.5 text-[10px] font-medium sm:block">
                        ESC
                    </kbd>
                </div>

                <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2" role="listbox">
                    {results.length === 0 ? (
                        <div className="text-muted-foreground px-3 py-10 text-center text-sm">
                            No matches for “{query}”.
                        </div>
                    ) : (
                        results.map((entry, index) => {
                            const showSection = entry.section !== lastSection;

                            lastSection = entry.section;

                            return (
                                <div key={`${entry.section}-${entry.title}`}>
                                    {showSection ? (
                                        <p className="text-muted-foreground px-2.5 pt-3 pb-1.5 text-[10.5px] font-semibold tracking-[0.08em] uppercase">
                                            {entry.section}
                                        </p>
                                    ) : null}
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={index === activeIndex}
                                        data-command-index={index}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onClick={() => go(index)}
                                        className={cn(
                                            'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm',
                                            index === activeIndex
                                                ? 'bg-accent text-accent-foreground'
                                                : 'text-foreground',
                                        )}
                                    >
                                        {entry.icon ? (
                                            <entry.icon className="text-muted-foreground size-4 shrink-0" />
                                        ) : (
                                            <ArrowRight className="text-muted-foreground size-4 shrink-0" />
                                        )}
                                        <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                                        {index === activeIndex ? (
                                            <CornerDownLeft className="text-muted-foreground size-3.5 shrink-0" />
                                        ) : null}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function CommandTrigger() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setOpen((value) => !value);
            }
        }

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hidden h-8 gap-2 rounded-lg border px-2.5 text-xs font-normal md:flex"
                onClick={() => setOpen(true)}
                aria-label="Search pages"
            >
                <Search className="size-3.5" />
                <span className="text-muted-foreground/80">Search…</span>
                <kbd className="bg-muted text-muted-foreground/80 pointer-events-none ml-6 rounded border px-1.5 py-px font-sans text-[10px]">
                    ⌘K
                </kbd>
            </Button>
            <CommandMenu open={open} onOpenChange={setOpen} />
        </>
    );
}
