export const INTRO_STYLE_IDS = [
    'gatefold',
    'lumen',
    'velvet',
    'orchid',
    'noir',
    'atelier',
    'celeste',
    'gilded',
    'silk',
    'vault',
] as const;

export type IntroStyleId = (typeof INTRO_STYLE_IDS)[number];

export type IntroStyleOption = {
    id: IntroStyleId;
    label: string;
    description: string;
};

/** Ten premium invitation open experiences — gatefold matches the product sample. */
export const INTRO_STYLE_OPTIONS: IntroStyleOption[] = [
    {
        id: 'gatefold',
        label: 'Gatefold seal',
        description: 'Blush paper doors part from a wax seal',
    },
    {
        id: 'lumen',
        label: 'Lumen halo',
        description: 'Champagne light rings bloom into the site',
    },
    {
        id: 'velvet',
        label: 'Velvet casket',
        description: 'Midnight lids lift like a jewelry box',
    },
    {
        id: 'orchid',
        label: 'Orchid vine',
        description: 'Botanical frames draw aside softly',
    },
    {
        id: 'noir',
        label: 'Noir iris',
        description: 'Black-tie shutter opens on champagne gold',
    },
    {
        id: 'atelier',
        label: 'Atelier card',
        description: 'Letterpress card lifts from linen paper',
    },
    {
        id: 'celeste',
        label: 'Celeste night',
        description: 'Starfield veil clears into the invitation',
    },
    {
        id: 'gilded',
        label: 'Gilded deco',
        description: 'Art Deco gold geometry retracts outward',
    },
    {
        id: 'silk',
        label: 'Silk screens',
        description: 'Horizontal silk panels glide apart',
    },
    {
        id: 'vault',
        label: 'Vault folio',
        description: 'Leather portfolio opens from a center clasp',
    },
];

export const DEFAULT_INTRO_STYLE: IntroStyleId = 'gatefold';

export function resolveIntroStyleId(raw?: string | null): IntroStyleId {
    const value = (raw || '').trim().toLowerCase();
    if ((INTRO_STYLE_IDS as readonly string[]).includes(value)) {
        return value as IntroStyleId;
    }
    return DEFAULT_INTRO_STYLE;
}

export function introStyleLabel(id?: string | null): string {
    const resolved = resolveIntroStyleId(id);
    return INTRO_STYLE_OPTIONS.find((option) => option.id === resolved)?.label ?? 'Gatefold seal';
}
