import { cn } from '@/lib/utils';
import { CARD_EDITOR_SECTIONS, type CardEditorSectionId } from '@/lib/card-editor';

export function CardEditorNav({
    active,
    onSelect,
}: {
    active: CardEditorSectionId;
    onSelect: (id: CardEditorSectionId) => void;
}) {
    return (
        <aside
            className={cn(
                'flex shrink-0 overflow-hidden bg-white',
                // Mobile dock
                'w-full flex-row items-stretch',
                // Desktop rail — min-h-0 so the section list can scroll
                'md:h-full md:min-h-0 md:w-[4.5rem] md:flex-col md:self-stretch md:border-r md:border-zinc-200/70 md:bg-zinc-50/60 xl:w-[13.5rem]',
            )}
        >
            <div className="hidden shrink-0 border-b border-zinc-200/70 px-2 py-3 md:block xl:px-4 xl:py-4">
                <p className="hidden text-[10px] font-semibold tracking-[0.18em] text-zinc-400 uppercase xl:block">Studio</p>
                <p className="text-center text-[12px] font-semibold tracking-tight text-zinc-900 xl:mt-1 xl:text-left xl:text-[15px]">
                    Card
                </p>
            </div>
            <nav
                className={cn(
                    'flex min-h-0 flex-1',
                    // Mobile: equal columns, no horizontal scroll
                    'grid grid-cols-6 gap-0.5 px-1 py-1.5',
                    // Desktop: vertical scroll for tall rails
                    'md:flex md:grid-cols-none md:flex-col md:space-y-1 md:overflow-x-hidden md:overflow-y-auto md:overscroll-y-contain md:p-1.5',
                    'md:[scrollbar-gutter:stable] md:[scrollbar-width:thin] md:[scrollbar-color:rgb(212_212_216)_transparent]',
                    'md:[&::-webkit-scrollbar]:w-1.5 md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-zinc-300/90 md:[&::-webkit-scrollbar-track]:bg-transparent',
                    'xl:p-2.5',
                )}
            >
                {CARD_EDITOR_SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const isActive = active === section.id;

                    return (
                        <button
                            key={section.id}
                            type="button"
                            title={`${section.label} — ${section.hint}`}
                            onClick={(event) => {
                                event.preventDefault();
                                // Keep keyboard focus without scrolling the viewport into view.
                                (event.currentTarget as HTMLButtonElement).focus({ preventScroll: true });
                                onSelect(section.id);
                            }}
                            className={cn(
                                'group relative flex items-center text-left transition-colors duration-150',
                                'touch-manipulation select-none',
                                // Mobile dock item
                                'min-w-0 flex-col justify-center gap-1 rounded-xl px-0.5 py-2',
                                // Desktop rail
                                'md:w-full md:flex-row md:items-center md:gap-2.5 md:rounded-2xl md:px-2 md:py-2.5 xl:items-start xl:px-2.5',
                                isActive
                                    ? 'bg-zinc-900 text-white shadow-md shadow-zinc-900/15'
                                    : 'text-zinc-600 active:bg-zinc-100 md:hover:bg-zinc-50 md:hover:text-zinc-900',
                            )}
                        >
                            <span
                                className={cn(
                                    'mx-auto grid size-7 shrink-0 place-items-center rounded-lg transition-colors md:mx-0 md:size-8 md:rounded-xl',
                                    isActive
                                        ? 'bg-white/10 text-white'
                                        : 'bg-zinc-100 text-zinc-500 md:bg-white md:ring-1 md:ring-zinc-950/5',
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="min-w-0 text-center md:hidden">
                                <span className="block truncate text-[9px] font-semibold leading-tight tracking-tight">
                                    {section.label}
                                </span>
                            </span>
                            <span className="hidden min-w-0 pt-0.5 xl:block xl:text-left">
                                <span className="block text-[13px] font-semibold leading-tight">{section.label}</span>
                                <span
                                    className={cn(
                                        'mt-0.5 block text-[11px] leading-snug transition-colors',
                                        isActive ? 'text-white/60' : 'text-zinc-400',
                                    )}
                                >
                                    {section.hint}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
