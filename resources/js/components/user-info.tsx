import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
    compact = false,
}: {
    user: User;
    showEmail?: boolean;
    compact?: boolean;
}) {
    const getInitials = useInitials();

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary rounded-lg text-xs font-medium">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            {!compact ? (
                <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    {showEmail ? (
                        <span className="text-muted-foreground truncate text-xs">
                            {user.email}
                        </span>
                    ) : null}
                </div>
            ) : null}
        </>
    );
}
