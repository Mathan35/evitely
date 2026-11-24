export type NameFieldKey = 'bride_name' | 'groom_name' | 'bride_display_name' | 'groom_display_name';

export type NameFieldConfig = {
    key: NameFieldKey;
    label: string;
    placeholder?: string;
};

/**
 * Host / celebrant fields shown in the Names & date inspector,
 * keyed by event occasion / type slug.
 */
export function nameFieldsForEvent(occasionOrType: string | null | undefined): NameFieldConfig[] {
    const key = (occasionOrType || 'wedding').toLowerCase().trim();

    if (['birthday'].includes(key)) {
        return [
            { key: 'bride_name', label: 'Celebrant name', placeholder: 'Alex' },
            { key: 'bride_display_name', label: 'Display name (optional)', placeholder: 'Alex Rivera' },
        ];
    }

    if (['baby-shower', 'baby-naming', 'naming-ceremony', 'baby'].includes(key)) {
        return [
            { key: 'bride_name', label: 'Parent / host name', placeholder: 'Maya' },
            { key: 'groom_name', label: 'Co-host / partner', placeholder: 'Jordan' },
            { key: 'bride_display_name', label: 'Baby name (optional)', placeholder: 'Aria' },
        ];
    }

    if (['housewarming'].includes(key)) {
        return [
            { key: 'bride_name', label: 'Host name', placeholder: 'The Patels' },
            { key: 'groom_name', label: 'Co-host (optional)', placeholder: 'Family' },
        ];
    }

    if (['graduation', 'school-event', 'college-event'].includes(key)) {
        return [
            { key: 'bride_name', label: 'Graduate name', placeholder: 'Alex' },
            { key: 'bride_display_name', label: 'Display name (optional)', placeholder: 'Alex Chen' },
            { key: 'groom_name', label: 'School / institution (optional)', placeholder: 'Harbor University' },
        ];
    }

    if (['corporate', 'corporate-event', 'business-event', 'conference', 'seminar', 'workshop', 'product-launch'].includes(key)) {
        return [
            { key: 'bride_name', label: 'Company / brand', placeholder: 'Northwind' },
            { key: 'groom_name', label: 'Organizer name', placeholder: 'Events team' },
            { key: 'bride_display_name', label: 'Event title override (optional)' },
        ];
    }

    if (['bridal-shower', 'bachelor-party', 'bachelorette-party'].includes(key)) {
        return [
            { key: 'bride_name', label: 'Guest of honor', placeholder: 'Priya' },
            { key: 'groom_name', label: 'Host name', placeholder: 'Ananya' },
        ];
    }

    if (['party', 'anniversary', 'reunion', 'dinner', 'get-together', 'farewell', 'welcome-party', 'social'].includes(key)) {
        return [
            { key: 'bride_name', label: 'Host name', placeholder: 'Jordan' },
            { key: 'groom_name', label: 'Co-host (optional)', placeholder: 'Sam' },
        ];
    }

    if (['custom', 'memorial', 'other'].includes(key)) {
        return [
            { key: 'bride_name', label: 'Primary name', placeholder: 'Host or title' },
            { key: 'groom_name', label: 'Secondary name (optional)' },
            { key: 'bride_display_name', label: 'Display line (optional)' },
        ];
    }

    // Wedding & related ceremonies
    return [
        { key: 'bride_name', label: 'Bride / partner one', placeholder: 'Priya' },
        { key: 'groom_name', label: 'Groom / partner two', placeholder: 'Arun' },
        { key: 'bride_display_name', label: 'Bride display name (optional)' },
        { key: 'groom_display_name', label: 'Groom display name (optional)' },
    ];
}
