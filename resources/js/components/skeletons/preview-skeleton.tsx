import { Bone } from '@/components/skeletons/_primitives';
import { FramedSiteContentSkeleton } from '@/components/skeletons/_framed-site-content-skeleton';
import { cn } from '@/lib/utils';

/**
 * Exact layout mirror of `pages/weddings/preview.tsx` (site path):
 * dark draft chrome · top bar · rounded PreviewDeviceShell · white scroll pane.
 */
export function PreviewSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'flex min-h-screen animate-in fade-in flex-col bg-[#1c1814] text-[#f4efe6] duration-300',
                className,
            )}
            aria-hidden
            data-skeleton-page="preview"
        >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <Bone className="h-3.5 w-52 max-w-[55%] bg-white/20" />
                <div className="flex items-center gap-3">
                    <Bone className="h-3.5 w-24 bg-white/25" />
                    <Bone className="h-3.5 w-16 bg-white/25" />
                </div>
            </div>

            <div
                className="flex min-h-0 flex-1 flex-col items-center px-3 py-4 sm:px-6"
                style={
                    {
                        ['--preview-accent' as string]: '#c6a36a',
                        ['--preview-btn' as string]: '#2b241c',
                    } as React.CSSProperties
                }
            >
                <div className="relative flex min-h-0 w-full max-w-[1140px] flex-1 flex-col">
                    <div className="relative flex h-[min(78vh,840px)] min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[1.15rem] shadow-[0_28px_80px_-24px_rgba(20,16,12,0.45)]">
                        <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain bg-white text-[#2b241c]">
                            <FramedSiteContentSkeleton />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
