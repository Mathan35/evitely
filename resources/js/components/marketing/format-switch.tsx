import { Globe, Mail } from 'lucide-react';
import type { ReactNode } from 'react';

export function FormatSwitch({
    tab,
    onChange,
    linkCount,
    cardCount,
}: {
    tab: 'links' | 'cards';
    onChange: (next: 'links' | 'cards') => void;
    linkCount: number;
    cardCount: number;
}) {
    return (
        <div className="mx-auto mt-8 w-full max-w-2xl" role="tablist" aria-label="Invitation format">
            <div className="grid grid-cols-2 gap-3">
                <FormatOption
                    active={tab === 'links'}
                    icon={<Globe className="h-4 w-4" aria-hidden />}
                    label="Event websites"
                    hint="Live RSVP pages"
                    count={linkCount}
                    onClick={() => onChange('links')}
                />
                <FormatOption
                    active={tab === 'cards'}
                    icon={<Mail className="h-4 w-4" aria-hidden />}
                    label="Invitation cards"
                    hint="Digital envelopes"
                    count={cardCount}
                    onClick={() => onChange('cards')}
                />
            </div>
        </div>
    );
}

function FormatOption({
    active,
    icon,
    label,
    hint,
    count,
    onClick,
}: {
    active: boolean;
    icon: ReactNode;
    label: string;
    hint: string;
    count: number;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`relative flex items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-3.5 text-left transition-all duration-300 sm:px-4 ${
                active
                    ? 'border border-[#c6a36a] bg-white text-[#1c1814] shadow-[0_16px_32px_-18px_rgba(198,163,106,0.95)] ring-4 ring-[#c6a36a]/18 dark:bg-[#221e19] dark:text-[#f4efe6]'
                    : 'border border-[#2b241c]/10 bg-[#f4efe6] text-[#6d645b] hover:border-[#c6a36a]/35 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-[#cfc6ba]'
            }`}
        >
            {active ? <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-[#c6a36a]" /> : null}
            <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
                    active ? 'bg-[#c6a36a] text-white shadow-[0_8px_16px_-8px_rgba(198,163,106,1)]' : 'bg-white text-[#c6a36a] ring-1 ring-[#c6a36a]/25 dark:bg-white/10'
                }`}
            >
                {icon}
            </span>
            <span className="min-w-0">
                <span className="block truncate text-[14px] leading-5 font-medium">{label}</span>
                <span className={`mt-0.5 block truncate text-[11px] ${active ? 'text-[#8a7d6a] dark:text-[#d8cfc3]' : 'text-[#9a9188]'}`}>
                    {count} templates · {hint}
                </span>
            </span>
        </button>
    );
}
