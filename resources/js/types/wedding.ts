export type WeddingTheme = {
    id: string;
    name: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    headingFont: string;
    bodyFont: string;
    borderRadius: string;
    animationStyle: string;
};

export type WeddingEventItem = {
    id: number;
    title: string;
    event_type: string;
    description: string | null;
    event_date: string | null;
    start_time: string | null;
    end_time: string | null;
    timezone: string;
    venue_name: string | null;
    venue_address: string | null;
    city: string | null;
    dress_code: string | null;
    cover_url: string | null;
    sort_order: number;
    is_public: boolean;
    map_url: string | null;
    google_calendar_url: string;
    ics_url: string;
};

export type WeddingSections = Record<string, boolean>;

export type WeddingGuestRow = {
    id: number;
    guest_group_id: number | null;
    table_id?: number | null;
    table?: string | null;
    group: string | null;
    first_name: string;
    last_name: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    country_code: string | null;
    relationship: string | null;
    number_of_guests: number;
    notes: string | null;
    invitation_status: string;
    invitation_sent_at?: string | null;
    invitation_send_count?: number;
    invitation_last_error?: string | null;
    invitation_last_channel?: string | null;
    email_sent_at?: string | null;
    email_send_count?: number;
    email_last_error?: string | null;
    whatsapp_sent_at?: string | null;
    whatsapp_send_count?: number;
    whatsapp_last_error?: string | null;
    sms_sent_at?: string | null;
    sms_send_count?: number;
    sms_last_error?: string | null;
    reminder_sent_at?: string | null;
    reminder_send_count?: number;
    reminder_last_error?: string | null;
    rsvp_status: string;
    guest_url: string;
};

export type WeddingPage = {
    id: number;
    slug: string;
    occasion: string;
    event_type?: string;
    event_type_name?: string;
    invitation_mode?: string;
    title?: string;
    description?: string | null;
    status: string;
    bride_name: string;
    groom_name: string;
    bride_display_name: string | null;
    groom_display_name: string | null;
    display: { bride: string; groom: string };
    hosts?: { id: number; name: string; role: string; description: string | null }[];
    wedding_date: string | null;
    starts_on?: string | null;
    wedding_time: string | null;
    timezone: string;
    venue_name: string | null;
    venue_address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    latitude: string | null;
    longitude: string | null;
    map_url: string | null;
    story: string | null;
    headline: string | null;
    host_message: string | null;
    cover_url: string | null;
    theme: WeddingTheme;
    theme_key: string;
    style: string;
    cultural_template: string | null;
    language: string;
    secondary_language: string | null;
    locale: string;
    /** Primary-language snapshot for client-side bilingual switching. */
    primary?: {
        bride_name: string;
        groom_name: string;
        headline: string | null;
        story: string | null;
        host_message: string | null;
        title: string | null;
        details: Record<string, string | null>;
    };
    /** Secondary (and other) locale rows — available on public + owner payloads. */
    translations?: { locale: string; content: Record<string, string | null> }[];
    music_url: string | null;
    music_enabled: boolean;
    sections: WeddingSections;
    rsvp_fields?: string[];
    details?: Record<string, string | null>;
    card?: {
        format: string;
        width: number;
        height: number;
        status: string;
        document: CardDocument;
    } | null;
    events: WeddingEventItem[];
    photos: {
        id: number;
        url: string;
        caption: string | null;
        is_cover: boolean;
        sort_order: number;
    }[];
    travel: {
        id: number;
        kind: string;
        title: string;
        description: string | null;
    }[];
    accommodations: {
        id: number;
        hotel_name: string;
        address: string | null;
        phone: string | null;
        website: string | null;
        booking_url: string | null;
        price_info: string | null;
        description: string | null;
    }[];
    guestbook: {
        id: number;
        name: string;
        message: string;
        photo_url: string | null;
    }[];
    qr_url: string;
    share_url: string;
    create_cta_url?: string | null;
    growth?: {
        share_count?: number;
        share_goal?: number;
        has_shared?: boolean;
        goal_met?: boolean;
        defer_paywall?: boolean;
        first_shared_at?: string | null;
    } | null;
    path_url?: string | null;
    subdomain_url?: string | null;
    subdomain_host?: string | null;
    subdomains_enabled?: boolean;
    invite_root_domain?: string | null;
    site_billing?: {
        status?: string;
        has_paid_pack?: boolean;
        legacy_account_pro?: boolean;
        features?: Record<string, boolean>;
        upgrade_url?: string | null;
    } | null;
    share_message: string;
    share_links: {
        whatsapp: string;
        telegram: string;
        facebook: string;
        email: string;
        sms?: string;
    };
    calendar_url: string;
    /** Google Calendar template URL for the primary public event (opens in browser). */
    google_calendar_url?: string | null;
    seo: {
        title: string;
        description: string;
        canonical: string;
        image: string | null;
    };
    guest: {
        name: string;
        email: string | null;
        token: string;
        number_of_guests: number;
    } | null;
    options: {
        locales: Record<string, { name: string; native: string }>;
        meals: Record<string, string>;
        themes: WeddingTheme[];
        styles: Record<string, string>;
        cultures: Record<string, string>;
        event_suggestions: Record<string, string>;
        occasions: Record<string, string>;
        timezones: string[];
    };
    owner: {
        groups: { id: number; name: string; description: string | null }[];
        guests: WeddingGuestRow[];
        rsvps: {
            id: number;
            guest_name: string;
            email: string;
            status: string;
            guest_count: number;
            meal_preference: string | null;
            dietary_restrictions: string | null;
            message: string | null;
            created_at?: string | null;
            events: { event_id: number; attending: boolean }[];
        }[];
        counts: {
            invited: number;
            viewed: number;
            responded: number;
            attending: number;
            not_attending: number;
            maybe: number;
            pending: number;
            remindable?: number;
            attending_guests: number;
        };
        analytics: {
            views: number;
            unique_views: number;
            guest_views: number;
            rsvps: number;
            shares: number;
            qr_scans: number;
        };
        guestbook_queue: {
            id: number;
            name: string;
            message: string;
            status: string;
            photo_url: string | null;
            created_at?: string | null;
        }[];
        tables?: {
            id: number;
            name: string;
            capacity: number;
            sort_order?: number;
            seated?: number;
        }[];
        collaborators?: {
            id: number;
            email: string;
            role: string;
            accepted_at?: string | null;
            is_accepted?: boolean;
        }[];
        gift_claims?: {
            id: number;
            gift_item_id: string;
            gift_label: string | null;
            name: string;
            email: string | null;
            note: string | null;
            status: string;
            created_at?: string | null;
        }[];
        guest_photo_queue?: {
            id: number;
            name: string;
            caption: string | null;
            status: string;
            photo_url: string | null;
            created_at?: string | null;
        }[];
        is_owner?: boolean;
        messaging?: {
            delivery_mode?: 'manual' | 'automated' | string;
            twilio?: {
                configured: boolean;
                email?: boolean;
                sms: boolean;
                whatsapp: boolean;
            };
            billing?: {
                plan: string;
                is_pro: boolean;
                site?: {
                    status: string;
                    can_edit: boolean;
                    can_use_premium?: boolean;
                    can_schedule_publish: boolean;
                    has_paid_pack: boolean;
                    is_view_only: boolean;
                    is_site?: boolean;
                    is_card_only?: boolean;
                    legacy_account_pro?: boolean;
                    upgrade_url: string;
                    days_left?: number | null;
                    features?: Record<string, boolean>;
                };
                automated_messaging: boolean;
                message_credits: number;
                guest_limit: number;
                guest_used: number;
                guest_remaining: number;
                at_guest_limit: boolean;
                upgrade_url: string;
            };
        };
        translations: { locale: string; content: Record<string, string | null> }[];
        music_url: string | null;
    } | null;
    gift_claim_counts?: Record<string, number>;
    guest_photos?: {
        id: number;
        name: string;
        caption: string | null;
        status: string;
        photo_url: string | null;
        created_at?: string | null;
    }[];
    rsvp_window?: {
        deadline: string | null;
        closed: boolean;
        soft_close: boolean;
    };
    accommodations?: {
        id: number;
        hotel_name: string | null;
        address?: string | null;
        price_info?: string | null;
        booking_url?: string | null;
        website?: string | null;
        description?: string | null;
    }[];
};

export type WeddingOptions = WeddingPage['options'];

export type CardElement = {
    id: string;
    type: 'text' | 'image' | 'shape' | 'icon' | 'decoration' | 'qr' | 'video';
    text?: string;
    src?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
    fontWeight?: number | string;
    letterSpacing?: number;
    lineHeight?: number;
    color?: string;
    align?: 'left' | 'center' | 'right';
    font?: string;
    rotation?: number;
    background?: string;
    objectPosition?: string;
};

export type CardDocument = {
    background?: string;
    backgroundImage?: string | null;
    template?: string;
    /** Occasion slug baked by CardLibrary (birthday, wedding, …). */
    occasion?: string;
    /** Bumped when invitationDocument layout/sizing changes. */
    layout_version?: number;
    elements?: CardElement[];
};

export type WeddingSummary = {
    id: number;
    slug: string;
    title?: string;
    bride_name: string;
    groom_name: string;
    wedding_date: string | null;
    city: string | null;
    status: string;
    theme: string;
    event_type?: string | null;
    invitation_mode?: string;
    guests_count: number;
    rsvps_count: number;
};
