export const HERO_STYLE_IDS = [
    'cinema',
    'horizon',
    'atelier',
    'veil',
    'prism',
    'sonnet',
    'ember',
    'folio',
    'mirage',
    'cascade',
] as const;

export type HeroStyleId = (typeof HERO_STYLE_IDS)[number];

export type HeroStyleOption = {
    id: HeroStyleId;
    label: string;
    description: string;
};

/** Ten advanced full-bleed hero compositions shared across every occasion. */
export const HERO_STYLE_OPTIONS: HeroStyleOption[] = [
    {
        id: 'cinema',
        label: 'Cinema glow',
        description: 'Spotlight bloom with luminous centered type',
    },
    {
        id: 'horizon',
        label: 'Horizon line',
        description: 'Lower-third landscape stack with a glowing rule',
    },
    {
        id: 'atelier',
        label: 'Atelier frame',
        description: 'Ornamental inset frame around elegant names',
    },
    {
        id: 'veil',
        label: 'Silk veil',
        description: 'Frosted mid-band floating over the photograph',
    },
    {
        id: 'prism',
        label: 'Prism wash',
        description: 'Diagonal light plane with cascading asymmetric type',
    },
    {
        id: 'sonnet',
        label: 'Sonnet scroll',
        description: 'Tall serif stack with a vertical side date ribbon',
    },
    {
        id: 'ember',
        label: 'Ember night',
        description: 'Warm vignette with ember particle glow around names',
    },
    {
        id: 'folio',
        label: 'Folio bleed',
        description: 'Edge-bleeding oversized title with inset supporting copy',
    },
    {
        id: 'mirage',
        label: 'Mirage dual',
        description: 'Split-tone wash with mirrored dual-axis composition',
    },
    {
        id: 'cascade',
        label: 'Cascade rise',
        description: 'Staggered line rise through a soft parallax haze',
    },
];

export const DEFAULT_HERO_STYLE: HeroStyleId = 'cinema';

export function resolveHeroStyleId(raw?: string | null): HeroStyleId {
    const value = (raw || '').trim().toLowerCase();
    if ((HERO_STYLE_IDS as readonly string[]).includes(value)) {
        return value as HeroStyleId;
    }
    return DEFAULT_HERO_STYLE;
}

export function heroStyleLabel(id?: string | null): string {
    const resolved = resolveHeroStyleId(id);
    return HERO_STYLE_OPTIONS.find((option) => option.id === resolved)?.label ?? 'Cinema glow';
}
