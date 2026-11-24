import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
    showName = true,
    className,
}: {
    user: User;
    showEmail?: boolean;
    showName?: boolean;
    className?: string;
}) {
    const getInitials = useInitials();

    return (
        <span className={cn('inline-flex items-center gap-2', className)}>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            {showName ? (
                <span className="user-name grid min-w-0 max-w-[7.5rem] flex-1 text-left text-sm leading-tight xl:max-w-[9rem]">
                    <span className="truncate font-medium">{user.name}</span>
                    {showEmail ? (
                        <span className="truncate text-xs text-muted-foreground">
                            {user.email}
                        </span>
                    ) : null}
                </span>
            ) : (
                <span className="sr-only">{user.name}</span>
            )}
        </span>
    );
}
