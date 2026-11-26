export type ShareMessageVars = {
    title?: string | null;
    date?: string | null;
    time?: string | null;
    place?: string | null;
    url?: string | null;
    guest_name?: string | null;
    guest_url?: string | null;
};

const DEFAULT_GUEST =
    "Hi {{guest_name}}, you're invited to {{title}}. Open your personal invite: {{guest_url}}";

export function fillShareTemplate(template: string, vars: ShareMessageVars): string {
    return template.replace(/\{\{\s*(title|date|time|place|url|guest_name|guest_url)\s*\}\}/g, (_, key: string) => {
        const value = vars[key as keyof ShareMessageVars];
        return value == null ? '' : String(value);
    });
}

/** Personal guest WhatsApp/SMS body — mirrors ShareMessageFactory::guestText. */
export function guestInviteShareText(input: {
    template?: string | null;
    title?: string | null;
    date?: string | null;
    time?: string | null;
    place?: string | null;
    guestName?: string | null;
    guestUrl: string;
}): string {
    const name = (input.guestName || 'there').trim() || 'there';
    const title = (input.title || 'our celebration').trim();
    const custom = (input.template || '').trim();
    const vars: ShareMessageVars = {
        title,
        date: input.date || '',
        time: input.time || '',
        place: input.place || '',
        url: input.guestUrl,
        guest_name: name,
        guest_url: input.guestUrl,
    };

    if (custom) {
        let body = fillShareTemplate(custom, vars).trim();
        if (input.guestUrl && !body.includes(input.guestUrl)) {
            body = `${body}\n${input.guestUrl}`;
        }
        return body;
    }

    return fillShareTemplate(DEFAULT_GUEST, vars).trim();
}

/** Live preview for editor templates. */
export function previewShareTemplate(
    template: string,
    vars: ShareMessageVars,
    fallbackUrlKey: 'url' | 'guest_url' = 'url',
): string {
    const filled = fillShareTemplate(template, vars).trim();
    const url = vars[fallbackUrlKey] || vars.url || '';
    if (url && filled && !filled.includes(url)) {
        return `${filled}\n${url}`;
    }
    return filled || url;
}
