import type { StayItem } from '@/lib/core-site-sections';

type AccommodationLike = {
    id?: number | string;
    hotel_name?: string | null;
    description?: string | null;
    address?: string | null;
    price_info?: string | null;
    booking_url?: string | null;
    website?: string | null;
    sort_order?: number | null;
};

/** Project relational accommodations into Core Extras StayItem shape. */
export function staysFromAccommodations(
    rows: AccommodationLike[] | null | undefined,
): StayItem[] {
    if (!Array.isArray(rows) || rows.length === 0) {
        return [];
    }

    return [...rows]
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((row) => {
            const name = (row.hotel_name || '').trim();
            const detail = (row.description || row.address || '').trim();
            const code = (row.price_info || '').trim();
            const url = (row.booking_url || row.website || '').trim();
            return {
                id: row.id != null ? `stay-${row.id}` : name,
                name,
                detail,
                ...(code ? { code } : {}),
                ...(url ? { url } : {}),
            } satisfies StayItem;
        })
        .filter((item) => item.name !== '');
}

type TravelLike = {
    kind?: string | null;
    title?: string | null;
    description?: string | null;
};

/** Prefer details notes; else synced "Travel notes" travel_details row. */
export function travelNotesFromRelational(
    detailsNotes: string | null | undefined,
    travel: TravelLike[] | null | undefined,
): string {
    const fromDetails = (detailsNotes || '').trim();
    if (fromDetails) {
        return fromDetails;
    }

    if (!Array.isArray(travel)) {
        return '';
    }

    const row = travel.find(
        (item) => item.kind === 'directions' && item.title === 'Travel notes',
    );

    return (row?.description || '').trim();
}
