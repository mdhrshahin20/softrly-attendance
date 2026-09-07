import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavGroup, NavItem } from '@/types';

const alwaysOpenTitles = new Set(['Overview', 'My day', 'Platform', 'Customers']);

function isNavItemActive(
    item: NavItem,
    isCurrentUrl: ReturnType<typeof useCurrentUrl>['isCurrentUrl'],
    isCurrentOrParentUrl: ReturnType<typeof useCurrentUrl>['isCurrentOrParentUrl'],
): boolean {
    if (item.match === 'exact') {
        return isCurrentUrl(item.href);
    }

    return isCurrentUrl(item.href) || isCurrentOrParentUrl(item.href);
}

function NavGroupSection({ group }: { group: NavGroup }) {
    const { state } = useSidebar();
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();
    const hasActiveItem = group.items.some((item) =>
        isNavItemActive(item, isCurrentUrl, isCurrentOrParentUrl),
    );
    const [open, setOpen] = useState(
        alwaysOpenTitles.has(group.title) || hasActiveItem,
    );
    const expanded = state === 'collapsed' ? true : open;

    useEffect(() => {
        if (hasActiveItem) {
            setOpen(true);
        }
    }, [hasActiveItem]);

    return (
        <Collapsible
            open={expanded}
            onOpenChange={setOpen}
            className="group/collapsible"
        >
            <SidebarGroup className="px-2 py-1">
                <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="text-sidebar-foreground/55 flex w-full cursor-pointer items-center text-[11px] font-semibold tracking-wider uppercase">
                        {group.title}
                        <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {group.items.map((item) => (
                                <SidebarMenuItem key={`${group.title}-${item.title}`}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isNavItemActive(
                                            item,
                                            isCurrentUrl,
                                            isCurrentOrParentUrl,
                                        )}
                                        tooltip={{ children: item.title }}
                                        className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:hover:bg-primary/10 data-[active=true]:hover:text-primary"
                                    >
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                    {item.badge ? (
                                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                                    ) : null}
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </CollapsibleContent>
            </SidebarGroup>
        </Collapsible>
    );
}

export function NavMain({ groups }: { groups: NavGroup[] }) {
    return (
        <>
            {groups.map((group) => (
                <NavGroupSection key={group.title} group={group} />
            ))}
        </>
    );
}
