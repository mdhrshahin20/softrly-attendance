import { usePage } from '@inertiajs/react';
import { SoftrlyLogo } from '@/components/brand/softrly-logo';

export default function AppLogo() {
    const { tenant, can } = usePage().props;
    const workspace = tenant?.name || 'Softrly';
    const product = can?.platform ? 'Platform' : tenant ? 'Workspace' : 'Softrly';

    return (
        <>
            <SoftrlyLogo href={null} variant="mark" markClassName="size-8" />
            <div className="ml-1 grid min-w-0 flex-1 text-left text-sm">
                <span className="text-sidebar-foreground truncate leading-tight font-semibold">{workspace}</span>
                <span className="text-sidebar-foreground/60 truncate text-[11px] leading-none">
                    {product}
                </span>
            </div>
        </>
    );
}
