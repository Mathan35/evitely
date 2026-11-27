import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarRange,
    Check,
    Clock3,
    MessageSquare,
    Minus,
    Sparkles,
    Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ShareMessageTemplatesPanel } from '@/components/studio/share-message-templates-panel';
import { StudioCard, StudioSurface } from '@/components/studio/studio-surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { startRazorpayCheckout, type RazorpayCheckoutOptions } from '@/lib/razorpay-checkout';
import { cn } from '@/lib/utils';

type SitePack = {
    id: string;
    name: string;
    tagline: string;
    days: number;
    included_credits: number;
    popular: boolean;
    price_label: string;
    amount_minor: number;
    price_label_with_credits?: string;
    amount_minor_with_credits?: number;
    price_label_bare?: string;
    amount_minor_bare?: number;
    features: string[];
    checkout_ready: boolean;
};

type FeatureComparisonRow = {
    label: string;
    free: boolean | string;
    paid: boolean | string;
};

type CreditPack = {
    id: string;
    name: string;
    credits: number;
    price_label: string;
    price_note: string;
    amount_minor: number;
    checkout_ready: boolean;
};

type BillingGuest = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    country_code: string | null;
    has_phone: boolean;
    has_email: boolean;
};

type AutoShareContact = {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country_code: string;
};

type AutoSharePending = {
    id: number;
    channel_mode: string;
    reserved_credits: number;
    scheduled_for: string | null;
    guest_ids: number[];
    recipient_count: number;
} | null;

type SiteCoupon = {
    id: number;
    code: string;
    discount_type?: 'percent' | 'amount' | string;
    percent_off?: number | null;
    amount_off_minor?: number | null;
    label: string;
    status: string;
    expires_at?: string | null;
};

type BillingPayload = {
    event_id: number;
    currency: string;
    currency_symbol?: string;
    gateway: string;
    gateway_label?: string;
    message_credits: number;
    coupons?: SiteCoupon[];
    has_site_coupon?: boolean;
    site_packs: SitePack[];
    site_custom: {
        min_days: number;
        max_days: number;
        name: string;
        tagline: string;
        features: string[];
    };
    credit_packs: CreditPack[];
    pending_message_packs?: Array<{
        id: number;
        sku: string;
        credits: number;
        paid_at?: string | null;
        activate_after?: string | null;
        message: string;
    }>;
    feature_comparison?: FeatureComparisonRow[];
    razorpay_ready: boolean;
    stripe_ready: boolean;
    allow_local_activate: boolean;
    guests?: BillingGuest[];
    auto_share?: AutoSharePending;
    messaging?: { whatsapp?: boolean; sms?: boolean; email?: boolean };
    share_templates?: {
        public?: string;
        guest?: string;
        default_public?: string;
        default_guest?: string;
        preview?: {
            title: string;
            date: string;
            time: string;
            place: string;
            url: string;
            guest_name: string;
            guest_url: string;
        };
    };
    state: {
        status: string;
        can_schedule_publish: boolean;
        has_paid_pack: boolean;
        scheduled_publish_at: string | null;
        pack_ends_at: string | null;
        trial_ends_at: string | null;
        days_left: number | null;
        upgrade_url: string;
        is_view_only: boolean;
        custom_starts_on: string | null;
        custom_ends_on: string | null;
        trial_available?: boolean;
        trial_used_on?: { id: number; title: string; status: string } | null;
        is_live_paused?: boolean;
    };
};

type Props = {
    wedding: { id: number; title: string; invitation_mode: string; status: string };
    billing: BillingPayload;
};

function friendlyCheckoutError(raw: string): string {
    const lower = raw.toLowerCase();
    if (
        lower.includes('stripe')
        || lower.includes('razorpay')
        || lower.includes('configured')
        || lower.includes('api key')
        || lower.includes('env')
    ) {
        return 'Checkout isn’t available right now. Please try again later or contact support.';
    }
    return raw || 'Something went wrong. Please try again.';
}

function xsrfToken(): string {
    const raw = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='))
        ?.split('=')
        .slice(1)
        .join('=');
    if (!raw) {
        return '';
    }
    try {
        return decodeURIComponent(raw);
    } catch {
        return raw;
    }
}

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const xsrf = xsrfToken();
    const res = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': xsrf,
        },
        body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as T & {
        message?: string;
        errors?: Record<string, string[]>;
    };
    if (!res.ok) {
        const field = data.errors ? Object.values(data.errors).flat().find(Boolean) : undefined;
        throw new Error(field || data.message || 'Request failed.');
    }
    return data;
}

function ComparisonValue({ value, tone }: { value: boolean | string; tone: 'free' | 'paid' }) {
    if (value === true) {
        return (
            <span
                className={cn(
                    'inline-flex size-6 items-center justify-center rounded-full',
                    tone === 'paid' ? 'bg-emerald-500/15 text-emerald-700' : 'bg-zinc-100 text-zinc-600',
                )}
            >
                <Check className="size-3.5" strokeWidth={2.5} />
            </span>
        );
    }
    if (value === false) {
        return (
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-zinc-50 text-zinc-300">
                <Minus className="size-3.5" strokeWidth={2.5} />
            </span>
        );
    }
    return (
        <span
            className={cn(
                'text-[12px] leading-snug font-medium',
                tone === 'paid' ? 'text-zinc-800' : 'text-zinc-500',
            )}
        >
            {value}
        </span>
    );
}

function formatMinor(amount: number, currency: string, symbol: string): string {
    if (currency === 'usd') {
        return `${symbol}${ (amount / 100).toLocaleString(undefined, { minimumFractionDigits: amount % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 }) }`;
    }
    return `${symbol}${Math.round(amount / 100).toLocaleString()}`;
}

function packDisplayPrice(
    pack: SitePack,
    includeCredits: boolean,
    opts?: {
        couponPercent?: number;
        couponAmountMinor?: number;
        currency?: string;
        symbol?: string;
    },
): { label: string; amount: number; was: string | null } {
    const bare = pack.amount_minor_bare ?? pack.amount_minor;
    const withCredits = pack.amount_minor_with_credits ?? pack.amount_minor;
    const creditsPortion = Math.max(0, withCredits - bare);
    let siteAmount = bare;
    let was: string | null = null;
    const percent = opts?.couponPercent ?? 0;
    const amountOff = opts?.couponAmountMinor ?? 0;
    if (percent > 0 || amountOff > 0) {
        was = formatMinor(includeCredits ? withCredits : bare, opts?.currency || 'inr', opts?.symbol || '₹');
        if (amountOff > 0) {
            siteAmount = Math.max(0, bare - amountOff);
        } else {
            siteAmount = Math.round((bare * (100 - percent)) / 100);
        }
    }
    const amount = includeCredits ? siteAmount + creditsPortion : siteAmount;
    return {
        label: formatMinor(amount, opts?.currency || 'inr', opts?.symbol || '₹'),
        amount,
        was,
    };
}

function statusTone(status: string): {
    label: string;
    detail: string;
    bar: string;
    chip: string;
} {
    switch (status) {
        case 'trial':
            return {
                label: 'Free trial',
                detail: 'Site is live · advanced editor options locked until you pick a pack',
                bar: 'from-amber-500/90 to-amber-600/70',
                chip: 'bg-amber-100 text-amber-950',
            };
        case 'awaiting_go_live':
            return {
                label: 'Scheduled',
                detail: 'Pack paid · site stays draft until go-live, then your paid window starts',
                bar: 'from-sky-500/90 to-emerald-500/70',
                chip: 'bg-sky-100 text-sky-950',
            };
        case 'paid':
            return {
                label: 'Paid active',
                detail: 'Full features unlocked · automation uses your message credits',
                bar: 'from-emerald-500/90 to-teal-600/70',
                chip: 'bg-emerald-100 text-emerald-950',
            };
        case 'expired':
            return {
                label: 'Expired',
                detail: 'Guests can still view · editing locked until you extend',
                bar: 'from-zinc-500/80 to-zinc-700/60',
                chip: 'bg-zinc-200 text-zinc-800',
            };
        default:
            return {
                label: 'Draft',
                detail: 'Publish now for a free guest-site try · share first · or pay first to schedule go-live',
                bar: 'from-zinc-800/90 to-emerald-700/60',
                chip: 'bg-zinc-100 text-zinc-800',
            };
    }
}

function formatWhen(value: string | null | undefined): string | null {
    if (!value) {
        return null;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        return value;
    }
    return d.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function EventBillingPage({ wedding, billing }: Props) {
    const intentSchedule =
        typeof window !== 'undefined'
        && new URLSearchParams(window.location.search).get('intent') === 'schedule';
    const [currency] = useState(billing.currency || 'inr');
    const [selected, setSelected] = useState<string>('site_30');
    const [includeCredits, setIncludeCredits] = useState(false);
    const availableCoupon = billing.coupons?.[0] ?? null;
    const [useCoupon, setUseCoupon] = useState(() => Boolean(billing.has_site_coupon));
    const [goLiveMode, setGoLiveMode] = useState<'now' | 'schedule'>(intentSchedule ? 'schedule' : 'now');
    const [scheduleAt, setScheduleAt] = useState('');
    const [startsOn, setStartsOn] = useState('');
    const [endsOn, setEndsOn] = useState('');
    const [quoteLabel, setQuoteLabel] = useState<string | null>(null);
    const [quoteDays, setQuoteDays] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [entered, setEntered] = useState(false);
    const payErrorRef = useRef<HTMLParagraphElement | null>(null);
    const [autoShareEnabled, setAutoShareEnabled] = useState(() => Boolean(billing.auto_share));
    const [autoShareChannel, setAutoShareChannel] = useState<'smart' | 'whatsapp' | 'sms' | 'email'>(
        () => (billing.auto_share?.channel_mode as 'smart' | 'whatsapp' | 'sms' | 'email') || 'smart',
    );
    const [selectedGuestIds, setSelectedGuestIds] = useState<number[]>(
        () => billing.auto_share?.guest_ids ?? [],
    );
    const [guestShareTemplate, setGuestShareTemplate] = useState(
        () => billing.share_templates?.guest || '',
    );
    useEffect(() => {
        setGuestShareTemplate(billing.share_templates?.guest || '');
    }, [billing.share_templates?.guest]);
    const [newContacts, setNewContacts] = useState<AutoShareContact[]>([]);
    const [contactDraft, setContactDraft] = useState<AutoShareContact>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        country_code: '+91',
    });

    const state = billing.state;
    const isCustom = selected === 'site_custom';
    const tone = statusTone(state.status);
    const selectedPack = billing.site_packs.find((p) => p.id === selected) ?? null;
    const currencyLabel = currency === 'usd' ? 'USD' : 'INR';
    const currencySymbol = billing.currency_symbol || (currency === 'usd' ? '$' : '₹');
    // Never surface third-party processor names (Razorpay / Stripe) to hosts.
    const gatewayLabel = 'Secure checkout';
    const comparisonRows = billing.feature_comparison?.length
        ? billing.feature_comparison
        : [];
    const selectedPrice = selectedPack
        ? packDisplayPrice(selectedPack, includeCredits, {
              couponPercent:
                  useCoupon && availableCoupon?.discount_type !== 'amount'
                      ? availableCoupon?.percent_off ?? 0
                      : 0,
              couponAmountMinor:
                  useCoupon && availableCoupon?.discount_type === 'amount'
                      ? availableCoupon?.amount_off_minor ?? 0
                      : 0,
              currency,
              symbol: currencySymbol,
          })
        : null;
    const billingGuests = billing.guests ?? [];

    const autoShareCreditsNeeded = useMemo(() => {
        if (!autoShareEnabled) {
            return 0;
        }
        const selected = billingGuests.filter((g) => selectedGuestIds.includes(g.id));
        const fromGuests = selected.filter((g) => {
            if (autoShareChannel === 'email') {
                return false;
            }
            if (autoShareChannel === 'whatsapp' || autoShareChannel === 'sms') {
                return g.has_phone;
            }
            // smart: phone burns a credit; email-only is free
            return g.has_phone;
        }).length;
        const fromNew = newContacts.filter((c) => {
            const hasPhone = c.phone.trim().length > 0;
            if (autoShareChannel === 'email') {
                return false;
            }
            if (autoShareChannel === 'whatsapp' || autoShareChannel === 'sms') {
                return hasPhone;
            }
            return hasPhone;
        }).length;
        return fromGuests + fromNew;
    }, [autoShareEnabled, autoShareChannel, billingGuests, selectedGuestIds, newContacts]);

    useEffect(() => {
        const id = window.requestAnimationFrame(() => setEntered(true));
        return () => window.cancelAnimationFrame(id);
    }, []);

    useEffect(() => {
        if (!error || !payErrorRef.current) {
            return;
        }
        payErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [error]);

    const headlineMeta = useMemo(() => {
        if (state.status === 'trial' && state.days_left != null) {
            return `${state.days_left} day${state.days_left === 1 ? '' : 's'} left`;
        }
        if (state.status === 'paid' && state.pack_ends_at) {
            return `Until ${new Date(state.pack_ends_at).toLocaleDateString()}`;
        }
        if (state.status === 'awaiting_go_live') {
            return formatWhen(state.scheduled_publish_at) ?? 'Set a publish time';
        }
        if (state.status === 'expired') {
            return 'Extend to keep editing';
        }
        return 'Cards stay free · sites are per event';
    }, [state]);

    const checkoutSummary = useMemo(() => {
        if (isCustom) {
            return {
                title: billing.site_custom.name,
                price: quoteLabel?.split(' · ')[1] ?? 'Pick dates for a quote',
                sub:
                    quoteDays != null
                        ? `${quoteDays} days · ${includeCredits ? 'with credits' : 'site only'}`
                        : billing.site_custom.tagline,
            };
        }
        if (selectedPack && selectedPrice) {
            return {
                title: selectedPack.name,
                price: selectedPrice.label,
                sub: includeCredits
                    ? `${selectedPack.days} days · ${selectedPack.included_credits} message credits`
                    : `${selectedPack.days} days · site only · top up credits anytime`,
            };
        }
        return { title: 'Choose a plan', price: '—', sub: '' };
    }, [isCustom, billing.site_custom, quoteLabel, quoteDays, selectedPack, selectedPrice, includeCredits]);

    async function refreshQuote() {
        if (!startsOn || !endsOn) {
            setQuoteLabel(null);
            setQuoteDays(null);
            return;
        }
        try {
            const data = await postJson<{ quote: { price_label: string; days: number; credits: number } }>(
                `/events/${wedding.id}/billing/quote`,
                { starts_on: startsOn, ends_on: endsOn, currency, include_credits: includeCredits },
            );
            setQuoteLabel(
                includeCredits
                    ? `${data.quote.days} days · ${data.quote.price_label} · ${data.quote.credits} credits`
                    : `${data.quote.days} days · ${data.quote.price_label} · site only`,
            );
            setQuoteDays(data.quote.days);
            setError(null);
        } catch (e) {
            setQuoteLabel(null);
            setQuoteDays(null);
            setError(e instanceof Error ? e.message : 'Could not quote');
        }
    }

    useEffect(() => {
        if (isCustom && startsOn && endsOn) {
            void refreshQuote();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reprice when credits toggle changes
    }, [includeCredits]);

    async function runCheckout() {
        setBusy(true);
        setError(null);
        try {
            if (isCustom) {
                if (!startsOn || !endsOn) {
                    throw new Error('Choose From and To dates for a custom plan.');
                }
                const data = await postJson<{
                    gateway?: string;
                    checkout?: RazorpayCheckoutOptions;
                    checkout_url?: string;
                    local?: boolean;
                    message?: string;
                }>(`/events/${wedding.id}/billing/checkout/site-custom`, {
                    starts_on: startsOn,
                    ends_on: endsOn,
                    go_live_mode: goLiveMode,
                    currency,
                    include_credits: includeCredits,
                    use_coupon: useCoupon && Boolean(availableCoupon),
                });
                await finishCheckout(data);
            } else {
                const data = await postJson<{
                    gateway?: string;
                    checkout?: RazorpayCheckoutOptions;
                    checkout_url?: string;
                    local?: boolean;
                    message?: string;
                }>(`/events/${wedding.id}/billing/checkout/site-pack`, {
                    sku: selected,
                    go_live_mode: goLiveMode,
                    scheduled_publish_at: goLiveMode === 'schedule' ? scheduleAt || null : null,
                    currency,
                    include_credits: includeCredits,
                    use_coupon: useCoupon && Boolean(availableCoupon),
                });
                await finishCheckout(data);
            }
        } catch (e) {
            setError(friendlyCheckoutError(e instanceof Error ? e.message : 'Checkout failed'));
        } finally {
            setBusy(false);
        }
    }

    async function finishCheckout(data: {
        gateway?: string;
        checkout?: RazorpayCheckoutOptions;
        checkout_url?: string;
        local?: boolean;
    }) {
        if (data.local) {
            router.reload({ only: ['billing'] });
            return;
        }
        if (data.gateway === 'stripe' && data.checkout_url) {
            window.location.href = data.checkout_url;
            return;
        }
        if (data.checkout) {
            await startRazorpayCheckout({
                orderUrl: `/events/${wedding.id}/billing/checkout/site-pack`,
                orderBody: {},
                verifyUrl: '/settings/billing/razorpay/verify',
                preloadedCheckout: data.checkout,
                onPaid: () => router.reload({ only: ['billing'] }),
            });
            return;
        }
        throw new Error('No checkout payload returned.');
    }

    async function saveSchedule() {
        if (!scheduleAt) {
            setError('Pick a publish date and time.');
            return;
        }
        if (autoShareEnabled) {
            const hasRecipients = selectedGuestIds.length > 0 || newContacts.length > 0;
            if (!hasRecipients) {
                setError('Add at least one guest or contact for auto-share, or turn it off.');
                return;
            }
            if (autoShareCreditsNeeded > billing.message_credits) {
                setError(
                    `Auto-share needs ${autoShareCreditsNeeded} message credit(s); you have ${billing.message_credits}. Buy credits above or remove phone recipients.`,
                );
                return;
            }
        }
        setBusy(true);
        setError(null);
        try {
            await postJson(`/events/${wedding.id}/billing/schedule`, {
                scheduled_publish_at: scheduleAt,
                share_guest_template: guestShareTemplate,
                auto_share: {
                    enabled: autoShareEnabled,
                    channel_mode: autoShareChannel,
                    guest_ids: selectedGuestIds,
                    new_contacts: newContacts,
                },
            });
            setNewContacts([]);
            router.reload({ only: ['billing'] });
        } catch (e) {
            setError(friendlyCheckoutError(e instanceof Error ? e.message : 'Could not schedule'));
        } finally {
            setBusy(false);
        }
    }

    function toggleGuest(id: number): void {
        setSelectedGuestIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }

    function addContactDraft(): void {
        const first = contactDraft.first_name.trim();
        const email = contactDraft.email.trim();
        const phone = contactDraft.phone.trim();
        if (!first && !email && !phone) {
            setError('Enter a name, email, or phone for the new contact.');
            return;
        }
        setNewContacts((prev) => [
            ...prev,
            {
                first_name: first || (email ? email.split('@')[0] : 'Guest'),
                last_name: contactDraft.last_name.trim(),
                email,
                phone,
                country_code: contactDraft.country_code.trim() || '+91',
            },
        ]);
        setContactDraft({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            country_code: contactDraft.country_code || '+91',
        });
        setError(null);
    }

    async function buyCredits(packId: string) {
        setBusy(true);
        setError(null);
        try {
            const data = await postJson<{
                gateway?: string;
                checkout?: RazorpayCheckoutOptions;
                checkout_url?: string;
                local?: boolean;
            }>(`/events/${wedding.id}/billing/checkout/credits`, { pack: packId, currency });
            if (data.local) {
                router.reload({ only: ['billing'] });
                return;
            }
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
                return;
            }
            if (data.checkout) {
                await startRazorpayCheckout({
                    orderUrl: '/settings/billing/razorpay/pack',
                    orderBody: { pack: packId },
                    verifyUrl: '/settings/billing/razorpay/verify',
                    preloadedCheckout: data.checkout,
                    onPaid: () => router.reload({ only: ['billing'] }),
                });
            }
        } catch (e) {
            setError(friendlyCheckoutError(e instanceof Error ? e.message : 'Credit purchase failed'));
        } finally {
            setBusy(false);
        }
    }

    const planOptions: Array<
        | { kind: 'fixed'; pack: SitePack }
        | { kind: 'custom' }
    > = [
        ...billing.site_packs.map((pack) => ({ kind: 'fixed' as const, pack })),
        { kind: 'custom' as const },
    ];

    return (
        <StudioSurface>
            <Head title={`Billing · ${wedding.title}`} />

            <div
                className={cn(
                    'space-y-8 transition duration-700 ease-out',
                    entered ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
                )}
            >
                {/* Status composition */}
                <section className="relative overflow-hidden rounded-[1.75rem] border border-zinc-950/8 bg-zinc-950 text-zinc-50 shadow-[0_1px_0_rgba(255,255,255,0.08)_inset]">
                    <div
                        aria-hidden
                        className={cn(
                            'pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r',
                            tone.bar,
                        )}
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-white/5 blur-3xl"
                    />

                    <div className="relative flex flex-col gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0 max-w-2xl">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[10px] font-semibold tracking-[0.22em] text-zinc-400 uppercase">
                                    Site plan
                                </p>
                                <span
                                    className={cn(
                                        'rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide',
                                        tone.chip,
                                    )}
                                >
                                    {tone.label}
                                </span>
                                <span className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                                    {currencyLabel} · {gatewayLabel}
                                </span>
                            </div>
                            <h1 className="mt-3 font-serif text-[clamp(1.9rem,5vw,3rem)] leading-[1.05] tracking-tight">
                                {wedding.title}
                            </h1>
                            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-zinc-300">
                                {tone.detail}
                            </p>
                            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-zinc-400">
                                <Clock3 className="size-3.5 shrink-0" />
                                {headlineMeta}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                                <p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                    Wallet
                                </p>
                                <p className="mt-1 font-serif text-2xl tabular-nums">
                                    {billing.message_credits}
                                    <span className="ml-1.5 text-[13px] font-sans font-medium text-zinc-400">
                                        credits
                                    </span>
                                </p>
                            </div>
                            <Link
                                href={`/events/${wedding.id}`}
                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-[13px] font-semibold text-zinc-100 transition hover:bg-white/10"
                            >
                                <ArrowLeft className="size-3.5" />
                                Studio
                            </Link>
                        </div>
                    </div>
                </section>

                {(billing.pending_message_packs?.length ?? 0) > 0 ? (
                    <StudioCard className="border-sky-200/80 bg-sky-50/90 p-4 dark:border-sky-400/20 dark:bg-sky-950/30">
                        <p className="text-[13px] font-semibold text-sky-950 dark:text-sky-100">
                            Message pack activating
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-sky-900/80 dark:text-sky-100/80">
                            {billing.pending_message_packs![0].message}
                        </p>
                        <ul className="mt-2 space-y-1">
                            {billing.pending_message_packs!.map((pack) => (
                                <li
                                    key={pack.id}
                                    className="text-[12px] font-medium text-sky-950/90 dark:text-sky-100/90"
                                >
                                    {pack.credits} credits · {pack.sku}
                                    {pack.activate_after
                                        ? ` · ready by ${formatWhen(pack.activate_after) ?? 'soon'}`
                                        : ''}
                                </li>
                            ))}
                        </ul>
                    </StudioCard>
                ) : null}

                {state.trial_available === false && state.trial_used_on && !state.has_paid_pack ? (
                    <StudioCard className="border-amber-200/80 bg-amber-50/90 p-4 dark:border-amber-400/20 dark:bg-amber-950/30">
                        <p className="text-[13px] font-semibold text-amber-950 dark:text-amber-100">
                            Free trial already used
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-amber-900/80 dark:text-amber-100/80">
                            Your one free guest-site try is on “{state.trial_used_on.title}”. Buy a pack
                            below to publish this invitation, or open that event to manage the trial site.
                        </p>
                        <Link
                            href={`/events/${state.trial_used_on.id}`}
                            className="mt-3 inline-flex text-[13px] font-semibold text-amber-950 underline underline-offset-2 dark:text-amber-100"
                        >
                            Open “{state.trial_used_on.title}”
                        </Link>
                    </StudioCard>
                ) : null}

                {comparisonRows.length > 0 ? (
                    <section className="overflow-hidden rounded-[1.5rem] border border-zinc-950/8 bg-white/90 shadow-[0_16px_48px_-36px_rgba(24,24,27,0.45)] dark:border-white/10 dark:bg-zinc-950/70">
                        <div className="border-b border-zinc-100 px-5 py-5 sm:px-6 dark:border-white/10">
                            <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                Compare plans
                            </p>
                            <h2 className="mt-1 font-serif text-2xl tracking-tight text-zinc-950 dark:text-white">
                                Free trial vs paid site
                            </h2>
                            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-zinc-500">
                                Cards stay free. Paid packs unlock the full site toolkit. Message credits are optional —
                                buy with a pack or top up later.
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[34rem] border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-zinc-100 dark:border-white/10">
                                        <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase sm:px-6">
                                            Feature
                                        </th>
                                        <th className="w-[9.5rem] px-3 py-3 text-center text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase sm:w-44">
                                            Free / trial
                                        </th>
                                        <th className="w-[9.5rem] bg-emerald-50/70 px-3 py-3 text-center text-[11px] font-semibold tracking-[0.14em] text-emerald-800 uppercase sm:w-44 dark:bg-emerald-950/30 dark:text-emerald-200">
                                            Paid site
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonRows.map((row) => (
                                        <tr
                                            key={row.label}
                                            className="border-b border-zinc-100/90 last:border-0 dark:border-white/5"
                                        >
                                            <td className="px-5 py-3.5 text-[13px] font-medium text-zinc-800 sm:px-6 dark:text-zinc-100">
                                                {row.label}
                                            </td>
                                            <td className="px-3 py-3.5 text-center align-middle">
                                                <div className="flex justify-center">
                                                    <ComparisonValue value={row.free} tone="free" />
                                                </div>
                                            </td>
                                            <td className="bg-emerald-50/40 px-3 py-3.5 text-center align-middle dark:bg-emerald-950/20">
                                                <div className="flex justify-center">
                                                    <ComparisonValue value={row.paid} tone="paid" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ) : null}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
                    <div className="space-y-6">
                        {availableCoupon ? (
                            <section className="overflow-hidden rounded-[1.35rem] border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-emerald-50 p-4 sm:p-5 dark:border-violet-500/20 dark:from-violet-950/40 dark:via-zinc-950 dark:to-emerald-950/30">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-semibold tracking-[0.16em] text-violet-700/80 uppercase dark:text-violet-300/80">
                                            Site coupon
                                        </p>
                                        <h2 className="mt-1 font-serif text-xl tracking-tight text-zinc-950 dark:text-white">
                                            {availableCoupon.label ||
                                                (availableCoupon.discount_type === 'amount'
                                                    ? `${currencySymbol}${Math.round((availableCoupon.amount_off_minor ?? 0) / 100)} off site cost`
                                                    : `${availableCoupon.percent_off ?? 0}% off site cost`)}
                                        </h2>
                                        <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                                            Code <span className="font-semibold tracking-wide">{availableCoupon.code}</span> —
                                            applies to the site pack price only. Message credits stay full price.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setUseCoupon((v) => !v)}
                                        className={cn(
                                            'inline-flex h-10 items-center rounded-full px-4 text-[13px] font-semibold transition',
                                            useCoupon
                                                ? 'bg-violet-700 text-white shadow-md shadow-violet-700/20'
                                                : 'bg-white text-zinc-700 ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:text-zinc-200',
                                        )}
                                    >
                                        {useCoupon ? 'Using coupon' : 'Use coupon'}
                                    </button>
                                </div>
                                {useCoupon && selectedPrice?.was ? (
                                    <p className="mt-3 text-[12px] text-violet-800/80 dark:text-violet-200/80">
                                        Checkout price updates to {selectedPrice.label}{' '}
                                        <span className="text-zinc-400 line-through">{selectedPrice.was}</span>
                                    </p>
                                ) : null}
                            </section>
                        ) : null}

                        {/* Credits bundle toggle */}
                        <section>
                            <div className="mb-3 px-1">
                                <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                    Messaging
                                </p>
                                <h2 className="mt-1 font-serif text-xl tracking-tight text-zinc-950 dark:text-white">
                                    Buy with or without credits
                                </h2>
                                <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-zinc-500">
                                    Site features are the same either way. Credits only change the price — add them now
                                    or top up later from your wallet.
                                </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => setIncludeCredits(false)}
                                    className={cn(
                                        'rounded-[1.25rem] border px-4 py-4 text-left transition',
                                        !includeCredits
                                            ? 'border-emerald-700/30 bg-emerald-50/90 dark:border-emerald-400/30 dark:bg-emerald-950/40'
                                            : 'border-zinc-950/8 bg-white/70 hover:border-zinc-950/15 dark:border-white/10 dark:bg-zinc-950/40',
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-[14px] font-semibold text-zinc-950 dark:text-white">
                                            Site only
                                        </p>
                                        {!includeCredits ? (
                                            <span className="grid size-6 place-items-center rounded-full bg-emerald-500 text-white">
                                                <Check className="size-3.5" strokeWidth={2.5} />
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">
                                        Lower price. Share links manually or buy credits later.
                                    </p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIncludeCredits(true)}
                                    className={cn(
                                        'rounded-[1.25rem] border px-4 py-4 text-left transition',
                                        includeCredits
                                            ? 'border-emerald-700/30 bg-emerald-50/90 dark:border-emerald-400/30 dark:bg-emerald-950/40'
                                            : 'border-zinc-950/8 bg-white/70 hover:border-zinc-950/15 dark:border-white/10 dark:bg-zinc-950/40',
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-[14px] font-semibold text-zinc-950 dark:text-white">
                                            Site + message credits
                                        </p>
                                        {includeCredits ? (
                                            <span className="grid size-6 place-items-center rounded-full bg-emerald-500 text-white">
                                                <Check className="size-3.5" strokeWidth={2.5} />
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">
                                        Best if you’ll send automated Email / SMS / WhatsApp invites.
                                    </p>
                                </button>
                            </div>
                        </section>

                        {/* Plans */}
                        <section>
                            <div className="mb-4 px-1">
                                <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                    Choose your window
                                </p>
                                <h2 className="mt-1 font-serif text-2xl tracking-tight text-zinc-950 dark:text-white">
                                    How long should this site stay live?
                                </h2>
                                <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-zinc-500">
                                    Fixed packs are the best per-day value. Custom matches an exact From → To range.
                                    Scheduling a future publish always requires payment first.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {planOptions.map((option, index) => {
                                    if (option.kind === 'custom') {
                                        const active = isCustom;
                                        return (
                                            <button
                                                key="site_custom"
                                                type="button"
                                                onClick={() => setSelected('site_custom')}
                                                style={{ transitionDelay: `${index * 40}ms` }}
                                                className={cn(
                                                    'group relative flex min-h-[11.5rem] flex-col rounded-[1.35rem] border p-4 text-left transition duration-300',
                                                    entered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
                                                    active
                                                        ? 'border-emerald-700/40 bg-emerald-950 text-white shadow-[0_12px_40px_-24px_rgba(6,78,59,0.55)]'
                                                        : 'border-zinc-950/8 bg-white/80 hover:-translate-y-0.5 hover:border-zinc-950/15 dark:border-white/10 dark:bg-zinc-950/50',
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <span
                                                        className={cn(
                                                            'grid size-9 place-items-center rounded-xl',
                                                            active ? 'bg-white/10' : 'bg-zinc-100 dark:bg-zinc-800',
                                                        )}
                                                    >
                                                        <CalendarRange
                                                            className={cn(
                                                                'size-4',
                                                                active ? 'text-emerald-200' : 'text-zinc-600',
                                                            )}
                                                        />
                                                    </span>
                                                    {active ? (
                                                        <span className="grid size-6 place-items-center rounded-full bg-emerald-400 text-emerald-950">
                                                            <Check className="size-3.5" strokeWidth={2.5} />
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="mt-4 text-[15px] font-semibold tracking-tight">
                                                    {billing.site_custom.name}
                                                </p>
                                                <p
                                                    className={cn(
                                                        'mt-1 text-[12px] leading-relaxed',
                                                        active ? 'text-emerald-100/80' : 'text-zinc-500',
                                                    )}
                                                >
                                                    {billing.site_custom.tagline || 'Exact From → To dates'}
                                                </p>
                                                <p
                                                    className={cn(
                                                        'mt-auto pt-4 font-serif text-xl',
                                                        active ? 'text-white' : 'text-zinc-950 dark:text-white',
                                                    )}
                                                >
                                                    Live quote
                                                </p>
                                            </button>
                                        );
                                    }

                                    const { pack } = option;
                                    const active = selected === pack.id;
                                    const display = packDisplayPrice(pack, includeCredits, {
                                        couponPercent:
                                            useCoupon && availableCoupon?.discount_type !== 'amount'
                                                ? availableCoupon?.percent_off ?? 0
                                                : 0,
                                        couponAmountMinor:
                                            useCoupon && availableCoupon?.discount_type === 'amount'
                                                ? availableCoupon?.amount_off_minor ?? 0
                                                : 0,
                                        currency,
                                        symbol: currencySymbol,
                                    });
                                    const perDay =
                                        pack.days > 0
                                            ? Math.round(display.amount / pack.days) / 100
                                            : null;

                                    return (
                                        <button
                                            key={pack.id}
                                            type="button"
                                            onClick={() => setSelected(pack.id)}
                                            style={{ transitionDelay: `${index * 40}ms` }}
                                            className={cn(
                                                'group relative flex min-h-[11.5rem] flex-col rounded-[1.35rem] border p-4 text-left transition duration-300',
                                                entered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
                                                active
                                                    ? 'border-zinc-950 bg-zinc-950 text-white shadow-[0_16px_48px_-28px_rgba(0,0,0,0.55)] dark:border-white dark:bg-white dark:text-zinc-950'
                                                    : 'border-zinc-950/8 bg-white/80 hover:-translate-y-0.5 hover:border-zinc-950/15 dark:border-white/10 dark:bg-zinc-950/50',
                                                pack.popular && !active
                                                    ? 'ring-1 ring-emerald-600/25'
                                                    : null,
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-[15px] font-semibold tracking-tight">
                                                        {pack.name}
                                                    </p>
                                                    {pack.tagline ? (
                                                        <p
                                                            className={cn(
                                                                'mt-0.5 text-[11px]',
                                                                active
                                                                    ? 'text-zinc-300 dark:text-zinc-500'
                                                                    : 'text-zinc-500',
                                                            )}
                                                        >
                                                            {pack.tagline}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                {pack.popular ? (
                                                    <span
                                                        className={cn(
                                                            'rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                                                            active
                                                                ? 'bg-emerald-400 text-emerald-950'
                                                                : 'bg-emerald-50 text-emerald-800',
                                                        )}
                                                    >
                                                        Popular
                                                    </span>
                                                ) : active ? (
                                                    <span className="grid size-6 place-items-center rounded-full bg-emerald-400 text-emerald-950 dark:bg-emerald-600 dark:text-white">
                                                        <Check className="size-3.5" strokeWidth={2.5} />
                                                    </span>
                                                ) : null}
                                            </div>

                                            <p className="mt-5 font-serif text-[1.85rem] leading-none tracking-tight">
                                                {display.label}
                                            </p>
                                            <p
                                                className={cn(
                                                    'mt-2 text-[12px]',
                                                    active
                                                        ? 'text-zinc-300 dark:text-zinc-500'
                                                        : 'text-zinc-500',
                                                )}
                                            >
                                                {pack.days} days
                                                {perDay != null
                                                    ? ` · ~${currencySymbol}${perDay.toFixed(perDay < 10 ? 2 : 0)}/day`
                                                    : null}
                                            </p>
                                            <p
                                                className={cn(
                                                    'mt-auto pt-4 text-[12px] font-medium',
                                                    active
                                                        ? 'text-emerald-300 dark:text-emerald-700'
                                                        : 'text-zinc-600 dark:text-zinc-400',
                                                )}
                                            >
                                                {includeCredits
                                                    ? `${pack.included_credits} message credits included`
                                                    : 'Site only · credits optional later'}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {isCustom ? (
                            <StudioCard className="overflow-hidden">
                                <div className="border-b border-zinc-100 px-5 py-4 dark:border-white/10">
                                    <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                        Custom dates
                                    </p>
                                    <p className="mt-1 text-[13px] text-zinc-500">
                                        Inclusive From → To · {billing.site_custom.min_days}–
                                        {billing.site_custom.max_days} days
                                    </p>
                                </div>
                                <div className="grid gap-4 p-5 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="starts_on">From</Label>
                                        <Input
                                            id="starts_on"
                                            type="date"
                                            value={startsOn}
                                            onChange={(e) => setStartsOn(e.target.value)}
                                            onBlur={() => void refreshQuote()}
                                            className="h-11 rounded-xl"
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="ends_on">To</Label>
                                        <Input
                                            id="ends_on"
                                            type="date"
                                            value={endsOn}
                                            onChange={(e) => setEndsOn(e.target.value)}
                                            onBlur={() => void refreshQuote()}
                                            className="h-11 rounded-xl"
                                        />
                                    </div>
                                    {quoteLabel ? (
                                        <p className="sm:col-span-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[13px] font-medium text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100">
                                            {quoteLabel}
                                        </p>
                                    ) : (
                                        <p className="sm:col-span-2 text-[12px] text-zinc-500">
                                            Pick both dates to see price
                                            {includeCredits ? ' and included credits' : ' (site only)'}.
                                        </p>
                                    )}
                                </div>
                            </StudioCard>
                        ) : null}

                        {/* Go live */}
                        <section>
                            <div className="mb-3 px-1">
                                <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                    Go live
                                </p>
                                <h2 className="mt-1 font-serif text-xl tracking-tight text-zinc-950 dark:text-white">
                                    When should the paid window start?
                                </h2>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => setGoLiveMode('now')}
                                    className={cn(
                                        'rounded-[1.25rem] border px-4 py-4 text-left transition',
                                        goLiveMode === 'now'
                                            ? 'border-emerald-700/30 bg-emerald-50/90 dark:border-emerald-400/30 dark:bg-emerald-950/40'
                                            : 'border-zinc-950/8 bg-white/70 hover:border-zinc-950/15 dark:border-white/10 dark:bg-zinc-950/40',
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <Sparkles
                                            className={cn(
                                                'size-4',
                                                goLiveMode === 'now' ? 'text-emerald-700' : 'text-zinc-400',
                                            )}
                                        />
                                        <p className="text-[14px] font-semibold text-zinc-950 dark:text-white">
                                            Publish when I pay
                                        </p>
                                    </div>
                                    <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">
                                        Plan starts immediately. Best if the site is ready now.
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setGoLiveMode('schedule')}
                                    className={cn(
                                        'rounded-[1.25rem] border px-4 py-4 text-left transition',
                                        goLiveMode === 'schedule'
                                            ? 'border-emerald-700/30 bg-emerald-50/90 dark:border-emerald-400/30 dark:bg-emerald-950/40'
                                            : 'border-zinc-950/8 bg-white/70 hover:border-zinc-950/15 dark:border-white/10 dark:bg-zinc-950/40',
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <CalendarRange
                                            className={cn(
                                                'size-4',
                                                goLiveMode === 'schedule' ? 'text-emerald-700' : 'text-zinc-400',
                                            )}
                                        />
                                        <p className="text-[14px] font-semibold text-zinc-950 dark:text-white">
                                            Schedule publish
                                        </p>
                                    </div>
                                    <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">
                                        Pay first, then pick the go-live moment. Days don’t start until then.
                                    </p>
                                </button>
                            </div>

                            {goLiveMode === 'schedule' ? (
                                <StudioCard className="mt-3 overflow-hidden">
                                    <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="schedule_at">Publish at</Label>
                                            <Input
                                                id="schedule_at"
                                                type="datetime-local"
                                                value={scheduleAt}
                                                onChange={(e) => setScheduleAt(e.target.value)}
                                                className="h-11 rounded-xl"
                                            />
                                        </div>
                                        {state.can_schedule_publish ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={busy}
                                                className="h-11 rounded-xl"
                                                onClick={() => void saveSchedule()}
                                            >
                                                Save schedule
                                            </Button>
                                        ) : null}
                                        <p className="sm:col-span-2 text-[12px] text-zinc-500">
                                            Your paid window begins at auto-publish — not at payment time.
                                        </p>
                                    </div>

                                    <div className="border-t border-zinc-100 p-4 dark:border-white/10">
                                        <label className="flex cursor-pointer items-start gap-3">
                                            <input
                                                type="checkbox"
                                                className="mt-1 size-4 rounded border-zinc-300"
                                                checked={autoShareEnabled}
                                                onChange={(e) => setAutoShareEnabled(e.target.checked)}
                                            />
                                            <span>
                                                <span className="block text-[14px] font-semibold text-zinc-950 dark:text-white">
                                                    Auto-share when site goes live
                                                </span>
                                                <span className="mt-0.5 block text-[12px] leading-relaxed text-zinc-500">
                                                    Reserve message credits now. WhatsApp/SMS/email invites send
                                                    automatically at publish time.
                                                </span>
                                            </span>
                                        </label>

                                        {autoShareEnabled ? (
                                            <div className="mt-4 grid gap-4">
                                                <div className="grid gap-1.5">
                                                    <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                                        Channel
                                                    </p>
                                                    <div
                                                        role="group"
                                                        aria-label="Auto-share channel"
                                                        className="flex flex-wrap gap-1 rounded-full border border-zinc-200/90 bg-white/90 p-1 dark:border-white/10 dark:bg-zinc-950/70"
                                                    >
                                                        {(
                                                            [
                                                                ['smart', 'Smart'],
                                                                ['whatsapp', 'WhatsApp'],
                                                                ['sms', 'SMS'],
                                                                ['email', 'Email'],
                                                            ] as const
                                                        ).map(([value, label]) => (
                                                            <button
                                                                key={value}
                                                                type="button"
                                                                onClick={() => setAutoShareChannel(value)}
                                                                className={cn(
                                                                    'rounded-full px-3 py-1.5 text-[12px] font-semibold transition',
                                                                    autoShareChannel === value
                                                                        ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                                                                        : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white',
                                                                )}
                                                            >
                                                                {label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <p className="text-[11px] text-zinc-500">
                                                        Smart picks WhatsApp, then SMS, then email per guest.
                                                    </p>
                                                </div>

                                                <div className="grid gap-1.5">
                                                    <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                                        Guests on this event
                                                    </p>
                                                    {billingGuests.length === 0 ? (
                                                        <p className="text-[12px] text-zinc-500">
                                                            No guests yet — add contacts below.
                                                        </p>
                                                    ) : (
                                                        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-2xl border border-zinc-100 p-2 dark:border-white/10">
                                                            {billingGuests.map((guest) => (
                                                                <li key={guest.id}>
                                                                    <label className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-white/5">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedGuestIds.includes(guest.id)}
                                                                            onChange={() => toggleGuest(guest.id)}
                                                                            className="size-4 rounded border-zinc-300"
                                                                        />
                                                                        <span className="min-w-0 flex-1">
                                                                            <span className="block truncate text-[13px] font-medium text-zinc-900 dark:text-white">
                                                                                {guest.name || 'Guest'}
                                                                            </span>
                                                                            <span className="block truncate text-[11px] text-zinc-500">
                                                                                {[guest.email, guest.phone].filter(Boolean).join(' · ') || 'No contact'}
                                                                            </span>
                                                                        </span>
                                                                    </label>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>

                                                <div className="grid gap-2">
                                                    <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                                        Add contacts
                                                    </p>
                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                        <Input
                                                            placeholder="First name"
                                                            value={contactDraft.first_name}
                                                            onChange={(e) =>
                                                                setContactDraft((d) => ({ ...d, first_name: e.target.value }))
                                                            }
                                                            className="h-10 rounded-xl"
                                                        />
                                                        <Input
                                                            placeholder="Last name"
                                                            value={contactDraft.last_name}
                                                            onChange={(e) =>
                                                                setContactDraft((d) => ({ ...d, last_name: e.target.value }))
                                                            }
                                                            className="h-10 rounded-xl"
                                                        />
                                                        <Input
                                                            placeholder="Email"
                                                            type="email"
                                                            value={contactDraft.email}
                                                            onChange={(e) =>
                                                                setContactDraft((d) => ({ ...d, email: e.target.value }))
                                                            }
                                                            className="h-10 rounded-xl"
                                                        />
                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder="+91"
                                                                value={contactDraft.country_code}
                                                                onChange={(e) =>
                                                                    setContactDraft((d) => ({
                                                                        ...d,
                                                                        country_code: e.target.value,
                                                                    }))
                                                                }
                                                                className="h-10 w-20 shrink-0 rounded-xl"
                                                            />
                                                            <Input
                                                                placeholder="Phone"
                                                                value={contactDraft.phone}
                                                                onChange={(e) =>
                                                                    setContactDraft((d) => ({ ...d, phone: e.target.value }))
                                                                }
                                                                className="h-10 min-w-0 flex-1 rounded-xl"
                                                            />
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-9 w-fit rounded-full px-4"
                                                        onClick={addContactDraft}
                                                    >
                                                        Add contact
                                                    </Button>
                                                    {newContacts.length > 0 ? (
                                                        <ul className="space-y-1 text-[12px] text-zinc-600 dark:text-zinc-300">
                                                            {newContacts.map((c, index) => (
                                                                <li
                                                                    key={`${c.email}-${c.phone}-${index}`}
                                                                    className="flex items-center justify-between gap-2 rounded-xl bg-zinc-50 px-3 py-2 dark:bg-white/5"
                                                                >
                                                                    <span className="min-w-0 truncate">
                                                                        {c.first_name}
                                                                        {c.last_name ? ` ${c.last_name}` : ''}
                                                                        {' · '}
                                                                        {[c.email, c.phone].filter(Boolean).join(' · ')}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        className="shrink-0 text-zinc-400 hover:text-zinc-900"
                                                                        onClick={() =>
                                                                            setNewContacts((prev) =>
                                                                                prev.filter((_, i) => i !== index),
                                                                            )
                                                                        }
                                                                    >
                                                                        <Minus className="size-3.5" />
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : null}
                                                </div>

                                                <p
                                                    className={cn(
                                                        'rounded-2xl px-3 py-2 text-[12px]',
                                                        autoShareCreditsNeeded > billing.message_credits
                                                            ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
                                                            : 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
                                                    )}
                                                >
                                                    Reserves <strong>{autoShareCreditsNeeded}</strong> credit
                                                    {autoShareCreditsNeeded === 1 ? '' : 's'} for WhatsApp/SMS
                                                    (email is free). Wallet: {billing.message_credits}.
                                                    {billing.auto_share
                                                        ? ` Pending blast: ${billing.auto_share.recipient_count} recipient(s).`
                                                        : ''}
                                                </p>

                                                <div className="min-w-0 space-y-2">
                                                    <div className="px-0.5">
                                                        <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                                            Invite message
                                                        </p>
                                                        <p className="mt-1 text-[14px] font-semibold text-zinc-950 dark:text-white">
                                                            {autoShareChannel === 'email'
                                                                ? 'Guest invite copy'
                                                                : autoShareChannel === 'sms'
                                                                  ? 'SMS invite message'
                                                                  : autoShareChannel === 'whatsapp'
                                                                    ? 'WhatsApp invite message'
                                                                    : 'WhatsApp / SMS invite message'}
                                                        </p>
                                                        {autoShareChannel === 'email' ? (
                                                            <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
                                                                Email uses the invitation email layout. This copy still
                                                                applies when Smart picks WhatsApp/SMS, and for guest-book
                                                                shares.
                                                            </p>
                                                        ) : (
                                                            <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
                                                                Customize the blast text with placeholders and emojis.
                                                                Saved when you save the schedule.
                                                            </p>
                                                        )}
                                                    </div>
                                                    <ShareMessageTemplatesPanel
                                                        mode="guest"
                                                        compact
                                                        publicTemplate=""
                                                        guestTemplate={guestShareTemplate}
                                                        defaultPublicTemplate={
                                                            billing.share_templates?.default_public || ''
                                                        }
                                                        defaultGuestTemplate={
                                                            billing.share_templates?.default_guest
                                                            || "Hi {{guest_name}}, you're invited to {{title}}. Open your personal invite: {{guest_url}}"
                                                        }
                                                        previewVars={
                                                            billing.share_templates?.preview || {
                                                                title: wedding.title || 'Your celebration',
                                                                date: '12 September 2026',
                                                                time: '18:00',
                                                                place: 'Venue',
                                                                url: 'https://invite.example/your-event',
                                                                guest_name: 'Amira',
                                                                guest_url:
                                                                    'https://invite.example/your-event/g/sample',
                                                            }
                                                        }
                                                        guestLabel={
                                                            autoShareChannel === 'sms'
                                                                ? 'SMS message'
                                                                : autoShareChannel === 'whatsapp'
                                                                  ? 'WhatsApp message'
                                                                  : 'Guest invite message'
                                                        }
                                                        guestHint={
                                                            autoShareChannel === 'email'
                                                                ? 'also used for WhatsApp / SMS'
                                                                : 'sent at go-live'
                                                        }
                                                        onGuestTemplate={setGuestShareTemplate}
                                                    />
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </StudioCard>
                            ) : null}
                        </section>

                        {/* Credits */}
                        <section>
                            <div className="mb-3 flex flex-wrap items-end justify-between gap-2 px-1">
                                <div>
                                    <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                        Message credits
                                    </p>
                                    <h2 className="mt-1 font-serif text-xl tracking-tight text-zinc-950 dark:text-white">
                                        Keep invites flying
                                    </h2>
                                </div>
                                <p className="text-[12px] text-zinc-500">
                                    Paid packs activate within 24 hours · automation needs an active site plan.
                                </p>
                            </div>

                            <StudioCard className="overflow-hidden">
                                <ul className="divide-y divide-zinc-100 dark:divide-white/10">
                                    {billing.credit_packs.map((pack) => (
                                        <li
                                            key={pack.id}
                                            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                                                    <MessageSquare className="size-4" />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-[14px] font-semibold text-zinc-950 dark:text-white">
                                                        {pack.name}
                                                    </p>
                                                    <p className="text-[12px] text-zinc-500">
                                                        {pack.price_label}
                                                        {pack.price_note ? ` · ${pack.price_note}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={busy || !pack.checkout_ready}
                                                className="h-10 w-full rounded-xl sm:w-auto"
                                                onClick={() => void buyCredits(pack.id)}
                                            >
                                                <Wallet className="size-3.5" />
                                                Top up
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </StudioCard>
                        </section>
                    </div>

                    {/* Sticky summary */}
                    <aside className="lg:sticky lg:top-6">
                        <div className="overflow-hidden rounded-[1.5rem] border border-zinc-950/10 bg-white/90 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.35)] backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/80">
                            <div className="border-b border-zinc-100 px-5 py-4 dark:border-white/10">
                                <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                    Order summary
                                </p>
                                <p className="mt-2 font-serif text-2xl tracking-tight text-zinc-950 dark:text-white">
                                    {checkoutSummary.title}
                                </p>
                                <p className="mt-1 text-[12px] text-zinc-500">{checkoutSummary.sub}</p>
                            </div>

                            <div className="space-y-3 px-5 py-4">
                                <div className="flex items-baseline justify-between gap-3">
                                    <span className="text-[13px] text-zinc-500">Total ({currencyLabel})</span>
                                    <span className="font-serif text-3xl tracking-tight text-zinc-950 dark:text-white">
                                        {checkoutSummary.price}
                                    </span>
                                </div>
                                <div className="rounded-xl bg-zinc-50 px-3 py-2.5 text-[12px] leading-relaxed text-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-300">
                                    {goLiveMode === 'schedule'
                                        ? 'You’ll pay now. Publish date can be set after payment — pack days start at go-live.'
                                        : 'After payment, the site can go live immediately and the paid window begins.'}
                                </div>

                                <ul className="space-y-1.5 pt-1">
                                    <li className="flex items-start gap-2 text-[12px] text-zinc-600 dark:text-zinc-300">
                                        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                                        Full paid site features unlocked
                                    </li>
                                    <li className="flex items-start gap-2 text-[12px] text-zinc-600 dark:text-zinc-300">
                                        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                                        {includeCredits
                                            ? isCustom
                                                ? 'Message credits included in quote'
                                                : `${selectedPack?.included_credits ?? 0} message credits included`
                                            : 'No credits now — top up anytime'}
                                    </li>
                                    <li className="flex items-start gap-2 text-[12px] text-zinc-600 dark:text-zinc-300">
                                        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                                        Pay securely · {currency === 'usd' ? 'USD ($)' : 'INR (₹)'}
                                    </li>
                                </ul>

                                {error ? (
                                    <p
                                        ref={payErrorRef}
                                        role="alert"
                                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[12px] leading-relaxed text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-100"
                                    >
                                        {error}
                                    </p>
                                ) : null}

                                <Button
                                    type="button"
                                    disabled={busy || (isCustom && (!startsOn || !endsOn))}
                                    className="mt-1 h-12 w-full rounded-xl text-[14px] font-semibold"
                                    onClick={() => void runCheckout()}
                                >
                                    <Sparkles className="size-4" />
                                    {busy ? 'Opening checkout…' : 'Continue to secure checkout'}
                                </Button>
                                <p className="text-center text-[11px] text-zinc-400">
                                    Secure one-time {currencyLabel} payment
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </StudioSurface>
    );
}
