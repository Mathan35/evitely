import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { useAuthGate } from '@/components/auth-gate';

function fingerprint(ids: string[]): string {
    return [...ids].sort().join('|');
}

const silentFavoriteVisit = {
    preserveScroll: true,
    preserveState: true,
    showProgress: false,
    only: ['galleryFavoriteIds'] as const,
};

export function useGalleryFavorites() {
    const { galleryFavoriteIds } = usePage().props;
    const { ensure } = useAuthGate();
    const serverIds = Array.isArray(galleryFavoriteIds) ? galleryFavoriteIds : [];
    const [override, setOverride] = useState<string[] | null>(null);
    const ids = override ?? serverIds;
    const serverKey = useMemo(() => fingerprint(serverIds), [serverIds]);
    const overrideKey = useMemo(() => (override ? fingerprint(override) : null), [override]);

    // Drop optimistic state once the shared prop matches what the user already sees.
    useEffect(() => {
        if (overrideKey !== null && overrideKey === serverKey) {
            setOverride(null);
        }
    }, [overrideKey, serverKey]);

    function toggle(id: string): void {
        if (!ensure({ type: 'favorite', id })) {
            return;
        }

        const base = override ?? serverIds;
        const removing = base.includes(id);
        const next = removing ? base.filter((value) => value !== id) : [...base, id];
        const rollback = base;

        // Heart / filter count update on this click — network follows quietly.
        setOverride(next);

        const options = {
            ...silentFavoriteVisit,
            onError: () => {
                setOverride(rollback);
            },
        };

        if (removing) {
            router.delete('/favorites', { data: { design_id: id }, ...options });

            return;
        }

        router.post('/favorites', { design_id: id }, options);
    }

    return {
        ids,
        count: ids.length,
        has: (id: string) => ids.includes(id),
        toggle,
    };
}
