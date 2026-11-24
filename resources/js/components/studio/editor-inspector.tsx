import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EditorInspector({
    title,
    description,
    panelKey,
    children,
    className,
}: {
    title: string;
    description?: string;
    panelKey?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <aside
            className={cn(
                'flex h-full min-h-0 w-full min-w-0 flex-col self-stretch overflow-hidden',
                'bg-white md:border-l md:border-zinc-200/70 md:bg-white/95 md:backdrop-blur-xl',
                className,
            )}
        >
            <div className="shrink-0 border-b border-zinc-100 px-3.5 py-2.5 sm:px-4 sm:py-3.5">
                <div
                    key={panelKey ? `${panelKey}-title` : title}
                    className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both ease-out"
                >
                    <h2 className="text-[15px] font-semibold tracking-tight text-zinc-900">{title}</h2>
                    {description ? (
                        <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-500 md:mt-1">{description}</p>
                    ) : null}
                </div>
            </div>
            <div
                data-editor-inspector-scroll
                className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3.5 py-3 sm:px-4 sm:py-3.5"
                onScroll={(event) => {
                    // Keep nested scroll local — never chain to the page.
                    event.stopPropagation();
                }}
            >
                <div
                    key={panelKey || title}
                    className="min-w-0 animate-in fade-in slide-in-from-bottom-3 duration-300 fill-mode-both ease-out"
                >
                    {children}
                </div>
            </div>
        </aside>
    );
}
