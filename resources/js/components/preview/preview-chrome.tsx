import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { PreviewDevice } from '@/lib/preview-device';
import { PreviewDeviceToggle } from '@/components/preview/preview-device-toggle';

export function PreviewChrome({
    device,
    onDeviceChange,
    children,
    className,
    style,
}: {
    device: PreviewDevice;
    onDeviceChange: (device: PreviewDevice) => void;
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}) {
    return (
        <div
            className={cn(
                'pointer-events-none absolute top-0 left-1/2 z-50 -translate-x-1/2 -translate-y-[calc(100%+0.85rem)]',
                className,
            )}
            style={style}
        >
            <div className="pointer-events-auto">
                <PreviewDeviceToggle device={device} onChange={onDeviceChange} />
            </div>
            {children}
        </div>
    );
}
