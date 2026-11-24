import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { EDITOR_DEVICE_WIDTH, type EditorDevice } from '@/components/studio/editor-modules';

/**
 * Live website preview stage.
 * Device width follows the viewport — no D/M toggle (parity with card editor).
 */
export function EditorCanvas({
    device = 'desktop',
    children,
}: {
    device?: EditorDevice;
    /** @deprecated Device toggle removed — kept for call-site compatibility. */
    onDeviceChange?: (device: EditorDevice) => void;
    children: ReactNode;
}) {
    const width = EDITOR_DEVICE_WIDTH[device];

    return (
        <section className="relative flex h-full min-h-0 min-w-0 w-full flex-1 flex-col bg-[linear-gradient(180deg,#f4f4f5_0%,#ececef_100%)]">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-3 py-3 sm:px-4 sm:pb-5 sm:pt-4">
                <div
                    className="mx-auto flex min-h-0 w-full max-w-full flex-1 flex-col animate-in fade-in zoom-in-95 fill-mode-both duration-300"
                    style={{ width, maxWidth: '100%' }}
                >
                    <div
                        className={cn(
                            'flex min-h-0 flex-1 flex-col overflow-hidden bg-white shadow-[0_28px_70px_-28px_rgba(24,24,27,0.55)] ring-1 ring-zinc-950/10',
                            device === 'mobile' ? 'rounded-[1.85rem]' : 'rounded-2xl',
                        )}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </section>
    );
}
