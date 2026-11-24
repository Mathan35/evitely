export const GALLERY_STYLE_IDS = [
    'mosaic',
    'masonry',
    'carousel',
    'hoverboard',
    'autocarousel',
    'polaroid',
    'salon',
    'cascade',
    'strip',
    'stack',
] as const;

export type GalleryStyleId = (typeof GALLERY_STYLE_IDS)[number];

export type GalleryStyleOption = {
    id: GalleryStyleId;
    label: string;
    description: string;
};

/** Ten professional gallery layouts shared across every occasion. */
export const GALLERY_STYLE_OPTIONS: GalleryStyleOption[] = [
    {
        id: 'mosaic',
        label: 'Editorial mosaic',
        description: 'Span-aware magazine grid with lightbox previews',
    },
    {
        id: 'masonry',
        label: 'Masonry columns',
        description: 'Fluid column cascade that adapts tile heights',
    },
    {
        id: 'carousel',
        label: 'Snap carousel',
        description: 'Interactive horizontal rail with peeking neighbors',
    },
    {
        id: 'hoverboard',
        label: 'Hoverboard cards',
        description: 'Equal cards with lift, zoom, and caption reveal',
    },
    {
        id: 'autocarousel',
        label: 'Auto carousel',
        description: 'Full-bleed slideshow that advances on its own',
    },
    {
        id: 'polaroid',
        label: 'Polaroid scatter',
        description: 'Framed prints with playful tilt and soft shadow',
    },
    {
        id: 'salon',
        label: 'Salon frames',
        description: 'Gallery-wall grid with refined bordered mounts',
    },
    {
        id: 'cascade',
        label: 'Cascade stagger',
        description: 'Asymmetric two-column waterfall with offsets',
    },
    {
        id: 'strip',
        label: 'Lightbox strip',
        description: 'Featured stage synced to a thumbnail strip',
    },
    {
        id: 'stack',
        label: 'Overlap stack',
        description: 'Layered cards that fan open on interaction',
    },
];

/** Preserves the classic mosaic used before gallery_style existed. */
export const DEFAULT_GALLERY_STYLE: GalleryStyleId = 'mosaic';

const GALLERY_STYLE_ALIASES: Record<string, GalleryStyleId> = {
    cinema: 'autocarousel',
};

export function resolveGalleryStyleId(raw?: string | null): GalleryStyleId {
    const value = (raw || '').trim().toLowerCase();
    if ((GALLERY_STYLE_IDS as readonly string[]).includes(value)) {
        return value as GalleryStyleId;
    }
    if (value in GALLERY_STYLE_ALIASES) {
        return GALLERY_STYLE_ALIASES[value];
    }
    return DEFAULT_GALLERY_STYLE;
}

export function galleryStyleLabel(id?: string | null): string {
    const resolved = resolveGalleryStyleId(id);
    return GALLERY_STYLE_OPTIONS.find((option) => option.id === resolved)?.label ?? 'Editorial mosaic';
}
