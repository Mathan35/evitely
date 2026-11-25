import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EDITOR_SECTIONS, type EditorSection, type EditorSectionId } from '@/components/studio/editor-modules';

export function EditorSectionNav({
    active,
    onSelect,
    sections = EDITOR_SECTIONS,
    lockedSectionIds = [],
}: {
    active: EditorSectionId;
    onSelect: (id: EditorSectionId) => void;
    sections?: EditorSection[];
    /** Sections that open a paywall instead of full editing. */
    lockedSectionIds?: EditorSectionId[];
}) {
    const locked = new Set(lockedSectionIds);

    return (
        <aside
            className={cn(
                'flex shrink-0 overflow-hidden bg-white',
                // Mobile dock
                'w-full flex-row items-stretch',
                // Desktop rail — min-h-0 so the section list can scroll inside the editor shell
                'md:h-full md:min-h-0 md:w-[4.5rem] md:flex-col md:self-stretch md:border-r md:border-zinc-200/70 md:bg-zinc-50/60 xl:w-[13.5rem]',
            )}
        >
            <div className="hidden shrink-0 border-b border-zinc-200/70 px-2 py-3 md:block xl:px-4 xl:py-4">
                <p className="hidden text-[10px] font-semibold tracking-[0.18em] text-zinc-400 uppercase xl:block">Studio</p>
                <p className="text-center text-[12px] font-semibold tracking-tight text-zinc-900 xl:mt-1 xl:text-left xl:text-[15px]">
                    Website
                </p>
            </div>
            <nav
                className={cn(
                    'flex min-h-0 min-w-0 max-w-full flex-1',
                    // Mobile: scrollable dock (min-w-0 required so overflow-x can shrink inside flex)
                    'touch-pan-x gap-0.5 overflow-x-auto overscroll-x-contain px-1 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                    // Desktop: vertical scroll for long section lists
                    'md:flex-col md:touch-pan-y md:space-y-1 md:overflow-x-hidden md:overflow-y-auto md:overscroll-y-contain md:p-1.5',
                    'md:[scrollbar-gutter:stable] md:[scrollbar-width:thin] md:[scrollbar-color:rgb(212_212_216)_transparent]',
                    'md:[&::-webkit-scrollbar]:w-1.5 md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-zinc-300/90 md:[&::-webkit-scrollbar-track]:bg-transparent',
                    'xl:p-2.5',
                )}
            >
                {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = active === section.id;
                    const isLocked = locked.has(section.id);

                    return (
                        <button
                            key={section.id}
                            type="button"
                            title={
                                isLocked
                                    ? `${section.label} — unlock with a site plan`
                                    : `${section.label} — ${section.hint}`
                            }
                            onClick={(event) => {
                                event.preventDefault();
                                const button = event.currentTarget as HTMLButtonElement;
                                button.focus({ preventScroll: true });
                                onSelect(section.id);
                                button.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                            }}
                            aria-current={isActive ? 'true' : undefined}
                            className={cn(
                                'group relative flex items-center text-left transition-[background-color,color,box-shadow,transform] duration-200',
                                'touch-manipulation select-none',
                                // Mobile dock item — fixed min width so tabs scroll cleanly
                                'w-[4.35rem] shrink-0 flex-col justify-center gap-1 rounded-xl px-0.5 py-2 active:scale-[0.97]',
                                // Desktop rail
                                'md:w-full md:flex-row md:items-center md:gap-2.5 md:rounded-2xl md:px-2 md:py-2.5 md:active:scale-100 xl:items-start xl:px-2.5',
                                isActive
                                    ? 'bg-zinc-900 text-white shadow-md shadow-zinc-900/15'
                                    : 'text-zinc-600 active:bg-zinc-100 md:hover:bg-zinc-50 md:hover:text-zinc-900',
                            )}
                        >
                            <span
                                className={cn(
                                    'relative mx-auto grid size-7 shrink-0 place-items-center rounded-lg transition-colors md:mx-0 md:size-8 md:rounded-xl',
                                    isActive
                                        ? 'bg-white/10 text-white'
                                        : 'bg-zinc-100 text-zinc-500 md:bg-white md:ring-1 md:ring-zinc-950/5',
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {isLocked ? (
                                    <span
                                        className={cn(
                                            'absolute -top-1 -right-1 grid size-3.5 place-items-center rounded-full',
                                            isActive ? 'bg-amber-300 text-zinc-950' : 'bg-zinc-900 text-white',
                                        )}
                                    >
                                        <Lock className="size-2" strokeWidth={2.5} />
                                    </span>
                                ) : null}
                            </span>
                            <span className="min-w-0 text-center md:hidden">
                                <span className="block truncate text-[9px] font-semibold leading-tight tracking-tight">
                                    {section.shortLabel ?? section.label}
                                </span>
                            </span>
                            <span className="hidden min-w-0 pt-0.5 xl:block xl:text-left">
                                <span className="flex items-center gap-1.5 text-[13px] font-semibold leading-tight">
                                    {section.label}
                                    {isLocked ? (
                                        <span className="rounded bg-amber-100 px-1 py-px text-[9px] font-semibold tracking-wide text-amber-900 uppercase">
                                            Pro
                                        </span>
                                    ) : null}
                                </span>
                                <span
                                    className={cn(
                                        'mt-0.5 block text-[11px] leading-snug transition-colors',
                                        isActive ? 'text-white/60' : 'text-zinc-400',
                                    )}
                                >
                                    {isLocked ? 'Included with a site plan' : section.hint}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
