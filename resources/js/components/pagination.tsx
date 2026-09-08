import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total?: number;
    from?: number | null;
    to?: number | null;
    current_page?: number;
    last_page?: number;
};

export function Pagination({ paginator }: { paginator: Paginated<unknown> }) {
    const lastPage = paginator.last_page ?? 1;
    const links = paginator.links ?? [];

    if (lastPage <= 1 && links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            {paginator.total != null ? (
                <p className="text-muted-foreground text-sm">
                    {paginator.from ?? 0}–{paginator.to ?? 0} of {paginator.total}
                </p>
            ) : (
                <span />
            )}
            <div className="flex flex-wrap gap-1">
                {links.map((link, index) => (
                    <Button
                        key={`${link.label}-${index}`}
                        variant={link.active ? 'default' : 'outline'}
                        size="sm"
                        disabled={!link.url}
                        onClick={() => {
                            if (link.url) {
                                router.get(link.url, {}, { preserveState: true, preserveScroll: true });
                            }
                        }}
                    >
                        {link.label.replace(/<[^>]+>/g, '')}
                    </Button>
                ))}
            </div>
        </div>
    );
}
