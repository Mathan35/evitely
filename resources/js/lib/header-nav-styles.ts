export const HEADER_STYLE_IDS = ['opal', 'quill', 'crest', 'aurora', 'luxe'] as const;

export type HeaderStyleId = (typeof HEADER_STYLE_IDS)[number];

export type HeaderStyleOption = {
    id: HeaderStyleId;
    label: string;
    description: string;
};

/** Five advanced header / link compositions — no plain default chrome. */
export const HEADER_STYLE_OPTIONS: HeaderStyleOption[] = [
    {
        id: 'opal',
        label: 'Opal capsule',
        description: 'Floating glass capsule with luminous link hover',
    },
    {
        id: 'quill',
        label: 'Quill editorial',
        description: 'Serif brand with ink-drawn underlines and mid-dots',
    },
    {
        id: 'crest',
        label: 'Crest monogram',
        description: 'Circular seal brand with diamond-separated links',
    },
    {
        id: 'aurora',
        label: 'Aurora split',
        description: 'Centered brand with mirrored link wings',
    },
    {
        id: 'luxe',
        label: 'Luxe ribbon',
        description: 'Full-width silk ribbon bar with micro gold rules',
    },
];

export const DEFAULT_HEADER_STYLE: HeaderStyleId = 'opal';

export function resolveHeaderStyleId(raw?: string | null): HeaderStyleId {
    const value = (raw || '').trim().toLowerCase();
    if ((HEADER_STYLE_IDS as readonly string[]).includes(value)) {
        return value as HeaderStyleId;
    }
    return DEFAULT_HEADER_STYLE;
}

export function headerStyleLabel(id?: string | null): string {
    const resolved = resolveHeaderStyleId(id);
    return HEADER_STYLE_OPTIONS.find((option) => option.id === resolved)?.label ?? 'Opal capsule';
}
