export type PublishCheck = {
    id: string;
    label: string;
    ok: boolean;
    required: boolean;
};

export type PublishSnapshot = {
    brideName?: string | null;
    groomName?: string | null;
    title?: string | null;
    weddingDate?: string | null;
    slug?: string | null;
    venueName?: string | null;
    city?: string | null;
    coverUrl?: string | null;
    listed?: boolean;
};

export function publishChecks(snapshot: PublishSnapshot): PublishCheck[] {
    const hasName = Boolean(
        (snapshot.brideName || '').trim() ||
            (snapshot.groomName || '').trim() ||
            (snapshot.title || '').trim(),
    );

    return [
        { id: 'name', label: 'Host or event name', ok: hasName, required: true },
        { id: 'date', label: 'Celebration date', ok: Boolean((snapshot.weddingDate || '').trim()), required: true },
        { id: 'slug', label: 'Guest link name', ok: Boolean((snapshot.slug || '').trim()), required: true },
        { id: 'saved', label: 'Saved to My Events', ok: snapshot.listed !== false, required: true },
        {
            id: 'venue',
            label: 'Venue or city',
            ok: Boolean((snapshot.venueName || '').trim() || (snapshot.city || '').trim()),
            required: false,
        },
        { id: 'cover', label: 'Cover image', ok: Boolean((snapshot.coverUrl || '').trim()), required: false },
    ];
}

export function publishBlocking(checks: PublishCheck[]): PublishCheck[] {
    return checks.filter((check) => check.required && !check.ok);
}
