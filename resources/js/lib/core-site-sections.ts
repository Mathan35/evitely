/** Core 8 guest extras — available gallery events only; default OFF in EventCatalog. */

export const CORE_SITE_SECTION_KEYS = [
    'faq',
    'attire',
    'gifts',
    'travel_stays',
    'explore',
    'livestream',
    'lineup',
    'wishes',
] as const;

export type CoreSiteSectionKey = (typeof CORE_SITE_SECTION_KEYS)[number];

/** Gallery / available event slugs (not coming-soon). */
/** Keep in sync with DesignGallery::occasions() + aliases hosts can create. */
export const CORE_SITE_AVAILABLE_OCCASIONS = [
    'wedding',
    'engagement',
    'reception',
    'birthday',
    'anniversary',
    'corporate',
    'corporate-event',
    'conference',
    'baby-shower',
    'party',
    'graduation',
    'bridal-shower',
    'housewarming',
    'custom',
    'memorial',
] as const;

export type FaqItem = { id: string; question: string; answer: string };
/** Registry item kinds — Amazon/registry URLs, UPI cash gifts, or plain links. */
export type GiftKind = 'link' | 'amazon' | 'registry' | 'upi' | 'wishlist' | 'cash';
export type GiftLink = {
    id: string;
    label: string;
    url: string;
    kind?: GiftKind;
    /** UPI VPA e.g. couple@okaxis — builds upi://pay deep link when set. */
    upi_id?: string;
    /** Optional amount for UPI / cash fund (INR as string, e.g. "2100"). */
    amount?: string;
    note?: string;
};
export type StayItem = { id: string; name: string; detail: string; code?: string; url?: string };

export function giftCheckoutHref(gift: GiftLink, payeeName = 'Hosts'): string {
    const kind = gift.kind || 'link';
    if ((kind === 'upi' || kind === 'cash') && gift.upi_id?.trim()) {
        const params = new URLSearchParams({
            pa: gift.upi_id.trim(),
            pn: payeeName.slice(0, 50),
            cu: 'INR',
        });
        if (gift.amount && Number(gift.amount) > 0) {
            params.set('am', String(Number(gift.amount)));
        }
        if (gift.label) {
            params.set('tn', gift.label.slice(0, 80));
        }
        return `upi://pay?${params.toString()}`;
    }
    return gift.url || '#';
}

export function giftKindLabel(kind?: GiftKind): string {
    switch (kind) {
        case 'amazon':
            return 'Amazon';
        case 'registry':
            return 'Registry';
        case 'wishlist':
            return 'Wishlist';
        case 'upi':
            return 'UPI';
        case 'cash':
            return 'Cash / UPI';
        default:
            return 'Link';
    }
}
export type ExploreItem = { id: string; title: string; note: string; url?: string };
export type LineupPerson = { id: string; name: string; role: string; blurb?: string };

export type CoreSiteExtrasContent = {
    faq: FaqItem[];
    attireTitle: string;
    attireBody: string;
    giftsIntro: string;
    gifts: GiftLink[];
    giftsClaimsEnabled: boolean;
    travelNotes: string;
    stays: StayItem[];
    explore: ExploreItem[];
    livestreamLabel: string;
    livestreamUrl: string;
    livestreamNote: string;
    lineup: LineupPerson[];
    wishesIntro: string;
};

export const CORE_SITE_SECTION_META: Record<
    CoreSiteSectionKey,
    { label: string; shortLabel: string; hint: string }
> = {
    faq: { label: 'FAQ', shortLabel: 'FAQ', hint: 'Answers guests ask before the day' },
    attire: { label: 'Dress code', shortLabel: 'Attire', hint: 'What to wear, simply stated' },
    gifts: { label: 'Registry & gifts', shortLabel: 'Gifts', hint: 'Amazon / registry links, UPI cash gifts, or a warm no-gifts note' },
    travel_stays: { label: 'Travel & stays', shortLabel: 'Travel', hint: 'Getting there and where to stay' },
    explore: { label: 'Things to do', shortLabel: 'Explore', hint: 'Local picks for out-of-town guests' },
    livestream: { label: 'Live stream', shortLabel: 'Stream', hint: 'Watch link for remote guests' },
    lineup: { label: 'Party & hosts', shortLabel: 'Lineup', hint: 'Wedding party, hosts, or speakers' },
    wishes: { label: 'Wishes wall', shortLabel: 'Wishes', hint: 'Guest blessings and messages' },
};

function uid(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function sampleCoreSiteExtras(occasion?: string | null): CoreSiteExtrasContent {
    const slug = (occasion || 'wedding').toLowerCase().replace(/_/g, '-');
    const isCorp = slug.includes('corporate') || slug.includes('conference');
    const isBaby = slug.includes('baby');
    const isGrad = slug.includes('graduation');
    const isBirthday = slug.includes('birthday');
    const isHouse = slug.includes('housewarming');
    const isParty = slug === 'party' || slug.includes('bridal') || slug.includes('shower');
    const isMemorial = slug.includes('memorial');

    return {
        faq: [
            {
                id: uid('faq'),
                question: 'What time should I arrive?',
                answer: isBirthday
                    ? 'Doors open 30 minutes early — cake cutting is the highlight, don’t miss it.'
                    : isCorp
                      ? 'Please check in 15 minutes before the first session.'
                      : 'Please arrive 20–30 minutes early so you can settle in before we begin.',
            },
            {
                id: uid('faq'),
                question: isCorp ? 'Is there a dress code?' : 'Are children welcome?',
                answer: isCorp
                    ? 'Business casual unless your invite says otherwise.'
                    : isBaby || isBirthday
                      ? 'Yes — little ones are part of the celebration.'
                      : isMemorial
                        ? 'All ages are welcome. Quiet moments are appreciated during the service.'
                        : 'We love your family. Please check your invitation for plus-ones and children.',
            },
            {
                id: uid('faq'),
                question: 'Is there parking?',
                answer: isHouse
                    ? 'Street parking is limited — ride-share or carpool if you can.'
                    : 'Complimentary parking is available at the venue. An attendant will guide you on arrival.',
            },
            {
                id: uid('faq'),
                question: isParty ? 'Can I bring a plus-one?' : 'Where do I RSVP?',
                answer: isParty
                    ? 'Your invite says whether a plus-one is included. Reply from your personal link.'
                    : 'Use the RSVP on this page — it only takes a minute.',
            },
        ],
        attireTitle: isCorp ? 'Dress code' : isMemorial ? 'Attire' : 'What to wear',
        attireBody: isCorp
            ? 'Business casual. Comfortable shoes recommended for the venue tour.'
            : isBirthday
              ? 'Festive casual — color welcome, sneakers fine for dancing.'
              : isHouse
                ? 'Comfortable and celebratory — you’ll be indoors and in the garden.'
                : isMemorial
                  ? 'Respectful attire in muted tones is appreciated.'
                  : 'Festive formal — think elevated colors, soft metallics, and celebration-ready outfits.',
        giftsIntro: isBaby
            ? 'Your presence is the gift. If you wish to celebrate further, here are a few ideas.'
            : isCorp || isMemorial
              ? 'No gifts — just bring yourself.'
              : isBirthday
                ? 'No gifts needed — but if you insist, experiences beat stuff.'
                : isHouse
                  ? 'A bottle of wine or a plant is lovely. No pressure.'
                  : 'Your presence is the greatest gift. Optional registries are linked below.',
        giftsClaimsEnabled: false,
        gifts: isCorp || isMemorial
            ? []
            : [
                  {
                      id: uid('gift'),
                      label: isBaby
                          ? 'Baby registry'
                          : isBirthday
                            ? 'Wishlist'
                            : isHouse
                              ? 'Home fund'
                              : 'Amazon / registry',
                      url: 'https://www.amazon.in/hz/wishlist/ls/example',
                      kind: (isBirthday ? 'wishlist' : 'amazon') as GiftKind,
                  },
                  ...(isBaby || isBirthday || isHouse
                      ? [
                            {
                                id: uid('gift'),
                                label: 'Send via UPI',
                                url: '',
                                kind: 'upi' as GiftKind,
                                upi_id: 'hosts@upi',
                                amount: '1100',
                                note: 'Optional blessing via GPay / PhonePe',
                            },
                        ]
                      : [
                            {
                                id: uid('gift'),
                                label: 'Honeymoon fund',
                                url: 'https://www.myregistry.com/',
                                kind: 'registry' as GiftKind,
                            },
                            {
                                id: uid('gift'),
                                label: 'Send via UPI',
                                url: '',
                                kind: 'upi' as GiftKind,
                                upi_id: 'couple@upi',
                                amount: '',
                                note: 'Any amount — opens UPI apps',
                            },
                        ]),
              ],
        travelNotes: isHouse
            ? 'We’re hosting at home. Share the pin with your driver — look for the string lights.'
            : isCorp
              ? 'Nearest metro stop is a 7-minute walk. Valet opens at 8:00.'
              : 'Fly into the main international airport (45 minutes by car). Ride-share and hotel shuttles are easy from arrivals.',
        stays: isHouse
            ? [
                  {
                      id: uid('stay'),
                      name: 'Neighborhood inn',
                      detail: 'Quiet rooms · 5 minutes away',
                      code: 'HOME26',
                  },
              ]
            : [
                  {
                      id: uid('stay'),
                      name: 'The Grand Hotel',
                      detail: 'Room block · walkable to the venue',
                      code: 'CELEBRATE26',
                      url: 'https://example.com/hotel',
                  },
                  {
                      id: uid('stay'),
                      name: 'Riverfront Suites',
                      detail: 'Mid-range · breakfast included',
                      code: 'GUESTS26',
                  },
              ],
        explore: isCorp
            ? [
                  { id: uid('ex'), title: 'Coffee cart', note: 'Lobby level — oat milk available.' },
                  { id: uid('ex'), title: 'Quiet lounge', note: 'Floor 3 for calls between sessions.' },
              ]
            : [
                  { id: uid('ex'), title: 'Old Town walk', note: 'Cafés, boutiques, and sunset views — 10 minutes away.' },
                  { id: uid('ex'), title: 'Local lunch favorite', note: 'Ask for the courtyard table.' },
                  { id: uid('ex'), title: 'Evening jazz bar', note: 'Perfect after-dinner stop for night owls.' },
              ],
        livestreamLabel: isGrad ? 'Watch the ceremony' : isCorp ? 'Join remote' : 'Watch live',
        livestreamUrl: 'https://example.com/live',
        livestreamNote: isCorp
            ? 'Remote link opens 10 minutes before — please mute on entry.'
            : 'Link opens 15 minutes before we start. Mute yourself and celebrate with us.',
        lineup: isCorp
            ? [
                  { id: uid('p'), name: 'Alex Morgan', role: 'Keynote', blurb: 'Opening remarks' },
                  { id: uid('p'), name: 'Jordan Lee', role: 'Host', blurb: 'Evening program' },
                  { id: uid('p'), name: 'Riley Chen', role: 'Ops', blurb: 'Questions & logistics' },
              ]
            : isBirthday
              ? [
                    { id: uid('p'), name: 'Sam Rivera', role: 'Host', blurb: 'Playlist curator' },
                    { id: uid('p'), name: 'Chris Patel', role: 'Cake captain', blurb: 'Do not touch until photos' },
                ]
              : [
                    { id: uid('p'), name: 'Sam Rivera', role: isBaby ? 'Host' : 'Maid of honor', blurb: 'Always the planner' },
                    { id: uid('p'), name: 'Chris Patel', role: isGrad ? 'Mentor' : 'Best man', blurb: 'Speech incoming' },
                    { id: uid('p'), name: 'Taylor Kim', role: 'Family', blurb: 'Keeping the energy high' },
                ],
        wishesIntro: isMemorial
            ? 'Share a memory or kind word — we will keep every note.'
            : isCorp
              ? 'Leave a note for the team — wins, thanks, or ideas.'
              : 'Leave a short blessing or note — we will treasure every word.',
    };
}

export function parseJsonArray<T extends { id: string }>(raw: string | null | undefined, fallback: T[]): T[] {
    if (!raw || !raw.trim()) {
        return fallback;
    }
    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) {
            return fallback;
        }
        return parsed
            .filter((row): row is T => Boolean(row) && typeof row === 'object')
            .map((row, index) => ({ ...row, id: (row as T).id || `${index}` }));
    } catch {
        return fallback;
    }
}

export function coreExtrasFromDetails(
    details: Record<string, unknown> | null | undefined,
    occasion?: string | null,
    overrides?: {
        stays?: StayItem[] | null;
        travelNotes?: string | null;
        /** When true, empty stays/notes hide samples instead of falling back. */
        preferRelationalTravel?: boolean;
    },
): CoreSiteExtrasContent {
    const sample = sampleCoreSiteExtras(occasion);
    const d = details || {};

    const str = (key: string, fallback: string) => {
        const value = d[key];
        return typeof value === 'string' && value.trim() ? value.trim() : fallback;
    };

    const explicitStaysJson =
        typeof d.travel_stays_json === 'string' && d.travel_stays_json.trim() !== '';
    const fromOverrides = Array.isArray(overrides?.stays) ? overrides.stays : null;
    const stays =
        overrides?.preferRelationalTravel && fromOverrides
            ? fromOverrides
            : explicitStaysJson
              ? parseJsonArray<StayItem>(d.travel_stays_json as string, sample.stays)
              : fromOverrides && fromOverrides.length > 0
                ? fromOverrides
                : parseJsonArray<StayItem>(
                      typeof d.travel_stays_json === 'string' ? d.travel_stays_json : null,
                      sample.stays,
                  );

    const overrideNotes =
        typeof overrides?.travelNotes === 'string' ? overrides.travelNotes.trim() : '';
    const travelNotes =
        overrides?.preferRelationalTravel && (overrideNotes || fromOverrides)
            ? overrideNotes || str('travel_stays_notes', '')
            : str('travel_stays_notes', overrideNotes || sample.travelNotes);

    return {
        faq: parseJsonArray<FaqItem>(typeof d.faq_json === 'string' ? d.faq_json : null, sample.faq),
        attireTitle: str('attire_title', sample.attireTitle),
        attireBody: str('attire_body', sample.attireBody),
        giftsIntro: str('gifts_intro', sample.giftsIntro),
        giftsClaimsEnabled: ['1', 'true', 'yes', 'on'].includes(
            String(d.gifts_claims_enabled ?? '').trim().toLowerCase(),
        ),
        gifts: parseJsonArray<GiftLink>(typeof d.gifts_json === 'string' ? d.gifts_json : null, sample.gifts),
        travelNotes,
        stays,
        explore: parseJsonArray<ExploreItem>(
            typeof d.explore_json === 'string' ? d.explore_json : null,
            sample.explore,
        ),
        livestreamLabel: str('livestream_label', sample.livestreamLabel),
        livestreamUrl: str('livestream_url', sample.livestreamUrl),
        livestreamNote: str('livestream_note', sample.livestreamNote),
        lineup: parseJsonArray<LineupPerson>(
            typeof d.lineup_json === 'string' ? d.lineup_json : null,
            sample.lineup,
        ),
        wishesIntro: str('wishes_intro', sample.wishesIntro),
    };
}

export function isCoreSiteSectionEnabled(
    sections: Record<string, boolean> | null | undefined,
    key: CoreSiteSectionKey,
): boolean {
    return sections?.[key] === true;
}

export function occasionSupportsCoreSiteExtras(occasion?: string | null): boolean {
    const slug = (occasion || '').toLowerCase().replace(/_/g, '-');
    return CORE_SITE_AVAILABLE_OCCASIONS.some((item) => item === slug || slug.includes(item));
}
