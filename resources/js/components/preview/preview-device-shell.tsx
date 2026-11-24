import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PreviewDeviceShell({
    children,
    className,
    style,
}: {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
}) {
    return (
        <div className={cn('relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden', className)} style={style}>
            {children}
        </div>
    );
}
