import { Baby, Briefcase, Cake, GraduationCap, Heart, Home, LayoutGrid, PartyPopper, Sparkles } from 'lucide-react';
import type { CSSProperties } from 'react';

const ACCENTS: Record<string, string> = {
    all: '#c6a36a',
    wedding: '#c6a36a',
    birthday: '#d4849a',
    corporate: '#5b6574',
    'baby-shower': '#7d9a78',
    party: '#7c5cbf',
    graduation: '#314e6e',
    'bridal-shower': '#c48b8b',
    housewarming: '#c26a3a',
    custom: '#6d5a45',
};

const LABEL_SLUGS: Record<string, string> = {
    'all events': 'all',
    weddings: 'wedding',
    wedding: 'wedding',
    birthdays: 'birthday',
    birthday: 'birthday',
    corporate: 'corporate',
    'baby showers': 'baby-shower',
    'baby shower': 'baby-shower',
    parties: 'party',
    party: 'party',
    graduations: 'graduation',
    graduation: 'graduation',
    bridals: 'bridal-shower',
    bridal: 'bridal-shower',
    'bridal shower': 'bridal-shower',
    housewarming: 'housewarming',
    custom: 'custom',
    'custom event': 'custom',
};

export function occasionSlug(value: string): string {
    return LABEL_SLUGS[value.trim().toLowerCase()] ?? value.trim().toLowerCase();
}

export function occasionAccent(slug: string): string {
    return ACCENTS[occasionSlug(slug)] ?? '#c6a36a';
}

export function OccasionIcon({
    slug,
    className = 'h-4 w-4',
    style,
}: {
    slug: string;
    className?: string;
    style?: CSSProperties;
}) {
    const key = occasionSlug(slug);

    if (key === 'wedding') {
        return <Heart className={className} style={style} aria-hidden />;
    }
    if (key === 'birthday') {
        return <Cake className={className} style={style} aria-hidden />;
    }
    if (key === 'corporate') {
        return <Briefcase className={className} style={style} aria-hidden />;
    }
    if (key === 'baby-shower') {
        return <Baby className={className} style={style} aria-hidden />;
    }
    if (key === 'party') {
        return <PartyPopper className={className} style={style} aria-hidden />;
    }
    if (key === 'graduation') {
        return <GraduationCap className={className} style={style} aria-hidden />;
    }
    if (key === 'bridal-shower') {
        return <Sparkles className={className} style={style} aria-hidden />;
    }
    if (key === 'housewarming') {
        return <Home className={className} style={style} aria-hidden />;
    }

    return <LayoutGrid className={className} style={style} aria-hidden />;
}

export function OccasionMark({ slug, size = 'md' }: { slug: string; size?: 'sm' | 'md' | 'lg' }) {
    const key = occasionSlug(slug);
    const accent = occasionAccent(key);
    const box = size === 'lg' ? 'h-12 w-12' : size === 'sm' ? 'h-7 w-7' : 'h-10 w-10';
    const icon = size === 'lg' ? 'h-5 w-5' : size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

    return (
        <span
            className={`inline-grid shrink-0 place-items-center rounded-full border border-[#2b241c]/8 bg-white shadow-sm dark:border-white/10 dark:bg-card ${box}`}
            style={{ color: accent }}
        >
            <OccasionIcon slug={key} className={icon} />
        </span>
    );
}
