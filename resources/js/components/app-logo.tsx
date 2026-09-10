import { usePage } from '@inertiajs/react';
import { AttendrlyLogo } from '@/components/brand/attendrly-logo';

export default function AppLogo() {
    const { tenant, can } = usePage().props;
    const workspace = tenant?.name || 'Attendrly';
    const product = can?.platform
        ? 'Platform'
        : tenant
          ? 'Workspace'
          : 'Attendrly';

    return (
        <span className="flex min-w-0 items-center gap-2.5">
            <AttendrlyLogo
                href={null}
                variant="mark"
                markClassName="size-8 rounded-[10px]"
            />
            <span className="grid min-w-0 flex-1 text-left">
                <span className="text-sidebar-foreground truncate text-sm leading-tight font-semibold">
                    {workspace}
                </span>
                <span className="text-sidebar-foreground/50 truncate text-[10px] leading-snug font-medium tracking-[0.08em] uppercase">
                    {product}
                </span>
            </span>
        </span>
    );
}
