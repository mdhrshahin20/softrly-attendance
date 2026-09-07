import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name, tenant, can } = usePage().props;
    const workspace = tenant?.name || name || 'Softrly';
    const product = can?.platform ? 'Platform' : tenant ? 'Workspace' : 'Softrly';

    return (
        <>
            <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <AppLogoIcon className="size-4" />
            </div>
            <div className="ml-1 grid min-w-0 flex-1 text-left text-sm">
                <span className="text-sidebar-foreground truncate leading-tight font-semibold">{workspace}</span>
                <span className="text-sidebar-foreground/60 truncate text-[11px] leading-none">
                    {product}
                </span>
            </div>
        </>
    );
}
