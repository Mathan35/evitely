import { HelpCircle, Home, Layers, LayoutGrid, List, Settings } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export type EditorRailTab = 'home' | 'sections' | 'layers' | 'list' | 'help' | 'settings';

export function EditorIconRail({
    active = 'sections',
    onChange,
}: {
    active?: EditorRailTab;
    onChange?: (tab: EditorRailTab) => void;
}) {
    const top: { id: EditorRailTab; label: string; icon: typeof Home; href?: string }[] = [
        { id: 'home', label: 'Home', icon: Home, href: '/events' },
        { id: 'sections', label: 'Sections', icon: LayoutGrid },
        { id: 'layers', label: 'Layers', icon: Layers },
        { id: 'list', label: 'List', icon: List },
    ];

    const bottom: { id: EditorRailTab; label: string; icon: typeof HelpCircle }[] = [
        { id: 'help', label: 'Help', icon: HelpCircle },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <aside className="flex w-14 shrink-0 flex-col items-center border-r border-white/[0.06] bg-[#0c0f15]/70 py-3 backdrop-blur-md">
            <div className="flex flex-1 flex-col items-center gap-1.5">
                {top.map((item) => {
                    const Icon = item.icon;
                    const isActive = active === item.id;
                    const className = cn(
                        'grid h-10 w-10 place-items-center rounded-xl transition',
                        isActive
                            ? 'bg-gradient-to-b from-[#d4a574]/25 to-[#d4a574]/10 text-[#f0d4ae] shadow-[0_0_20px_-8px_rgba(212,165,116,0.8)] ring-1 ring-[#d4a574]/35'
                            : 'text-[#8b93a7] hover:bg-white/[0.05] hover:text-[#e8eaef]',
                    );

                    if (item.href) {
                        return (
                            <Link key={item.id} href={item.href} aria-label={item.label} className={className}>
                                <Icon className="h-[18px] w-[18px]" />
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            type="button"
                            aria-label={item.label}
                            aria-pressed={isActive}
                            onClick={() => onChange?.(item.id)}
                            className={className}
                        >
                            <Icon className="h-[18px] w-[18px]" />
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col items-center gap-1.5">
                {bottom.map((item) => {
                    const Icon = item.icon;
                    const isActive = active === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            aria-label={item.label}
                            aria-pressed={isActive}
                            onClick={() => onChange?.(item.id)}
                            className={cn(
                                'grid h-10 w-10 place-items-center rounded-xl transition',
                                isActive
                                    ? 'bg-gradient-to-b from-[#d4a574]/25 to-[#d4a574]/10 text-[#f0d4ae] ring-1 ring-[#d4a574]/35'
                                    : 'text-[#8b93a7] hover:bg-white/[0.05] hover:text-[#e8eaef]',
                            )}
                        >
                            <Icon className="h-[18px] w-[18px]" />
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}
