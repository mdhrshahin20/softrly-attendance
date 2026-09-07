import type { ComponentPropsWithoutRef } from 'react';
import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavFooter({
    items,
    className,
    ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup> & {
    items: NavItem[];
}) {
    return (
        <SidebarGroup
            {...props}
            className={`group-data-[collapsible=icon]:p-0 ${className || ''}`}
        >
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => {
                        const href = toUrl(item.href);
                        const isExternal = href.startsWith('http');

                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
                                >
                                    {isExternal ? (
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {item.icon && (
                                                <item.icon className="h-5 w-5" />
                                            )}
                                            <span>{item.title}</span>
                                        </a>
                                    ) : (
                                        <Link href={item.href} prefetch>
                                            {item.icon && (
                                                <item.icon className="h-5 w-5" />
                                            )}
                                            <span>{item.title}</span>
                                        </Link>
                                    )}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
