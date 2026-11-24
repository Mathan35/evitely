import { Head, Link, router } from '@inertiajs/react';
import { Check, Circle, CreditCard, Landmark, Smartphone, Sparkles, Wallet } from 'lucide-react';
import { useRef, useState } from 'react';
import { StudioCard, StudioEyebrow } from '@/components/studio/studio-surface';
import { Button } from '@/components/ui/button';
import { startRazorpayCheckout } from '@/lib/razorpay-checkout';
import { cn } from '@/lib/utils';

type PlanCard = {
    id: string;
    name: string;
    tagline: string;
    price_label: string;
    guest_limit: number;
    co_host_limit: number;
    monthly_credits: number;
    automated_messaging: boolean;
    features: string[];
};

type SeasonCard = {
    id: string;
    name: string;
    tagline: string;
    price_label: string;
    price_note: string;
    duration_months: number;
    included_credits: number;
    popular: boolean;
    features: string[];
    checkout_ready: boolean;
};

type PackCard = {
    id: string;
    name: string;
    credits: number;
    price_label: string;
    price_note?: string;
    checkout_ready: boolean;
};

type ChecklistItem = {
    id: string;
    label: string;
    done: boolean;
    hint: string;
};

type RecentPayment = {
    id: number;
    kind: string;
    sku: string;
    amount_label: string;
    status: string;
    payment_id?: string | null;
    paid_at?: string | null;
};

type BillingProps = {
    billing: {
        plan: string;
        plan_name: string;
        is_pro: boolean;
        plan_ends_at?: string | null;
        message_credits: number;
        guest_limit: number;
        co_host_limit: number;
        automated_messaging: boolean;
        stripe_ready: boolean;
        razorpay_ready: boolean;
        driver: string;
        gateway?: string;
        allow_local_activate: boolean;
        billing_model?: string;
        is_billing_admin?: boolean;
        launch_checklist?: ChecklistItem[];
        recent_payments?: RecentPayment[];
        subscription: {
            active: boolean;
            on_grace_period: boolean;
            ends_at: string | null;
        } | null;
        plans: PlanCard[];
        seasons: SeasonCard[];
        packs: PackCard[];
    };
};

function formatEndDate(value?: string | null): string | null {
    if (!value) {
        return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

const PAY_METHODS = [
    { label: 'UPI', icon: Smartphone },
    { label: 'Cards', icon: CreditCard },
    { label: 'Netbanking', icon: Landmark },
] as const;

export default function Billing({ billing }: BillingProps) {
    const endsLabel = formatEndDate(billing.plan_ends_at);
    const [payingSku, setPayingSku] = useState<string | null>(null);
    const [payError, setPayError] = useState<string | null>(null);
    const [paySuccess, setPaySuccess] = useState<string | null>(null);
    const payingLock = useRef(false);
    const usesRazorpay = Boolean(billing.razorpay_ready);
    const canCheckout = usesRazorpay && billing.seasons.some((s) => s.checkout_ready);
    const checkoutBusy = payingSku !== null;

    function reloadBilling(message?: string): void {
        setPaySuccess(message ?? 'Payment successful. Your plan is updated.');
        router.reload({ only: ['billing'] });
    }

    async function paySeason(season: string): Promise<void> {
        if (payingLock.current) {
            return;
        }
        payingLock.current = true;
        setPayError(null);
        setPaySuccess(null);
        setPayingSku(season);
        try {
            if (!usesRazorpay && !billing.stripe_ready && !billing.allow_local_activate) {
                setPayError('Checkout isn’t available right now. Please try again later.');
                return;
            }
            await startRazorpayCheckout({
                orderUrl: '/settings/billing/razorpay/season',
                orderBody: { season },
                verifyUrl: '/settings/billing/razorpay/verify',
                onPaid: () => reloadBilling('Season pass unlocked. Pro is active.'),
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Payment failed.';
            if (message !== 'Payment cancelled.') {
                setPayError(message);
            }
        } finally {
            payingLock.current = false;
            setPayingSku(null);
        }
    }

    async function payPack(pack: string): Promise<void> {
        if (payingLock.current) {
            return;
        }
        payingLock.current = true;
        setPayError(null);
        setPaySuccess(null);
        setPayingSku(pack);
        try {
            if (!usesRazorpay && !billing.stripe_ready && !billing.allow_local_activate) {
                setPayError('Checkout isn’t available right now. Please try again later.');
                return;
            }
            await startRazorpayCheckout({
                orderUrl: '/settings/billing/razorpay/pack',
                orderBody: { pack },
                verifyUrl: '/settings/billing/razorpay/verify',
                onPaid: () => reloadBilling('Message credits added to your account.'),
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Payment failed.';
            if (message !== 'Payment cancelled.') {
                setPayError(message);
            }
        } finally {
            payingLock.current = false;
            setPayingSku(null);
        }
    }

    return (
        <>
            <Head title="Billing" />

            <div className="min-w-0 space-y-5 sm:space-y-6">
                <StudioCard className="overflow-hidden">
                    <div className="relative overflow-hidden border-b border-zinc-950/8 bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950 px-4 py-6 text-white sm:px-6 sm:py-7">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-emerald-400/20 blur-3xl"
                        />
                        <div className="relative flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <StudioEyebrow>
                                    <span className="text-white/60">Wedding season</span>
                                </StudioEyebrow>
                                <h2 className="mt-1.5 font-serif text-[1.65rem] leading-none tracking-tight sm:text-3xl">
                                    {billing.plan_name}
                                </h2>
                                <p className="mt-2.5 max-w-lg text-sm text-pretty text-white/70">
                                    {billing.is_pro
                                        ? endsLabel
                                            ? `Pro is active through ${endsLabel}. One-time season pass — no monthly auto-renew.`
                                            : 'Pro is active. Automated messaging and higher guest limits are on.'
                                        : 'Pay once for your wedding window. Free keeps phone sharing; Pro unlocks automated Twilio sends.'}
                                </p>
                                {billing.razorpay_ready ? (
                                    <ul className="mt-4 flex flex-wrap gap-2">
                                        {PAY_METHODS.map(({ label, icon: Icon }) => (
                                            <li
                                                key={label}
                                                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/85 ring-1 ring-white/15"
                                            >
                                                <Icon className="size-3 opacity-80" aria-hidden />
                                                {label}
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                            <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur">
                                <p className="text-[10px] font-semibold tracking-[0.14em] text-white/55 uppercase">
                                    Message credits
                                </p>
                                <p className="mt-1 font-serif text-3xl tabular-nums leading-none">
                                    {billing.message_credits}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 px-4 py-4 sm:grid-cols-3 sm:px-6">
                        {(
                            [
                                { label: 'Guests / event', value: billing.guest_limit },
                                { label: 'Co-hosts', value: billing.co_host_limit },
                                {
                                    label: 'Automated Twilio',
                                    value: billing.automated_messaging ? 'On' : 'Off',
                                },
                            ] as const
                        ).map((stat) => (
                            <div key={stat.label} className="rounded-2xl bg-zinc-50 px-3.5 py-3">
                                <p className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
                                    {stat.label}
                                </p>
                                <p className="mt-1 font-serif text-xl tabular-nums text-zinc-950">
                                    {stat.value}
                                </p>
                            </div>
                        ))}
                    </div>

                </StudioCard>

                {payError ? (
                    <p
                        role="alert"
                        className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] text-rose-800 ring-1 ring-rose-100"
                    >
                        {payError}
                    </p>
                ) : null}

                {paySuccess ? (
                    <p
                        role="status"
                        className="rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] text-emerald-900 ring-1 ring-emerald-100"
                    >
                        {paySuccess}
                    </p>
                ) : null}

                {billing.razorpay_ready || billing.stripe_ready || billing.allow_local_activate ? (
                    <StudioCard className="border border-emerald-100 bg-emerald-50/40 px-5 py-3.5">
                        <p className="text-[12px] leading-relaxed text-zinc-600">
                            Secure checkout supports UPI, cards, and netbanking where available. You’ll
                            get a confirmation after a successful payment.
                        </p>
                    </StudioCard>
                ) : (
                    <StudioCard className="border border-amber-200/80 bg-amber-50/60 px-5 py-4">
                        <p className="text-[11px] font-semibold tracking-[0.14em] text-amber-800/70 uppercase">
                            Checkout
                        </p>
                        <h3 className="mt-1 font-serif text-xl text-zinc-950">Payments temporarily unavailable</h3>
                        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-zinc-600">
                            We’re finishing payment setup. Please try again later or contact support if
                            you need help right away.
                        </p>
                    </StudioCard>
                )}

                <div>
                    {(billing as { sites?: Array<{ id: number; title: string; status: string; billing_url: string }> }).sites
                        ?.length ? (
                        <StudioCard className="mb-5 overflow-hidden">
                            <div className="border-b border-zinc-100 px-5 py-4">
                                <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                    Your sites
                                </p>
                                <p className="mt-1 text-[13px] text-zinc-500">
                                    Site plans are per invitation — open a site to buy packs or schedule publish.
                                </p>
                            </div>
                            <ul className="divide-y divide-zinc-100">
                                {(
                                    billing as {
                                        sites: Array<{ id: number; title: string; status: string; billing_url: string }>;
                                    }
                                ).sites.map((site) => (
                                    <li
                                        key={site.id}
                                        className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[13px]"
                                    >
                                        <div>
                                            <p className="font-medium text-zinc-950">{site.title}</p>
                                            <p className="text-[12px] text-zinc-500">{site.status}</p>
                                        </div>
                                        <Link
                                            href={site.billing_url}
                                            className="text-[12px] font-semibold text-zinc-900 underline-offset-2 hover:underline"
                                        >
                                            Manage plan →
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </StudioCard>
                    ) : null}

                    <div className="flex flex-col gap-2 px-1 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                Season passes
                            </p>
                            <p className="mt-1 text-[13px] text-pretty text-zinc-500">
                                Legacy account passes are no longer sold. Buy a per-site pack from an event Billing page.
                            </p>
                        </div>
                        {billing.razorpay_ready && canCheckout ? (
                            <p className="max-w-xs text-left text-[12px] font-medium text-emerald-700 sm:text-right">
                                UPI recommended · Indian cards & netbanking
                            </p>
                        ) : null}
                    </div>
                    <div className="mt-3 grid gap-4 lg:grid-cols-2">
                        {billing.seasons.map((season) => (
                            <StudioCard
                                key={season.id}
                                className={cn(
                                    'overflow-hidden',
                                    season.popular && 'ring-2 ring-zinc-900',
                                )}
                            >
                                <div className="border-b border-zinc-100 px-4 py-5 sm:px-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                                {season.popular ? 'Most popular' : 'Season pass'}
                                            </p>
                                            <h3 className="mt-1 font-serif text-2xl text-zinc-950">
                                                {season.name}
                                            </h3>
                                            <p className="mt-1 text-[13px] text-zinc-500">
                                                {season.tagline}
                                            </p>
                                        </div>
                                        <div className="sm:shrink-0 sm:text-right">
                                            <p className="font-sans text-2xl font-semibold tabular-nums text-zinc-950">
                                                {season.price_label}
                                            </p>
                                            <p className="mt-0.5 text-[11px] font-medium text-zinc-500">
                                                {season.price_note}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <ul className="space-y-2 px-5 py-4">
                                    {season.features.map((feature) => (
                                        <li
                                            key={feature}
                                            className="flex items-start gap-2 text-[13px] text-zinc-700"
                                        >
                                            <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex flex-wrap gap-2 border-t border-zinc-100 px-4 py-4 sm:px-5">
                                    {season.checkout_ready ? (
                                        <Button
                                            type="button"
                                            className={cn(
                                                'h-10 w-full rounded-full sm:w-auto sm:min-w-[12rem]',
                                                checkoutBusy &&
                                                    payingSku !== season.id &&
                                                    'pointer-events-none',
                                            )}
                                            disabled={payingSku === season.id}
                                            aria-busy={payingSku === season.id || undefined}
                                            onClick={() => void paySeason(season.id)}
                                        >
                                            <Sparkles className="size-3.5" />
                                            {payingSku === season.id
                                                ? 'Opening checkout…'
                                                : usesRazorpay
                                                  ? `Pay ${season.price_label}`
                                                  : `Buy ${season.duration_months}-month pass`}
                                        </Button>
                                    ) : (
                                        <p className="text-[12px] text-zinc-500">
                                            Checkout isn’t available right now. Please try again later.
                                        </p>
                                    )}
                                </div>
                            </StudioCard>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    {billing.plans.map((plan) => (
                        <StudioCard key={plan.id} className="overflow-hidden">
                            <div className="border-b border-zinc-100 px-5 py-5">
                                <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                    Included features
                                </p>
                                <h3 className="mt-1 font-serif text-2xl text-zinc-950">{plan.name}</h3>
                                <p className="mt-1 text-[13px] text-zinc-500">{plan.tagline}</p>
                            </div>
                            <ul className="space-y-2 px-5 py-4">
                                {plan.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-start gap-2 text-[13px] text-zinc-700"
                                    >
                                        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <div className="border-t border-zinc-100 px-5 py-4">
                                {plan.id === billing.plan ? (
                                    <p className="text-[13px] font-semibold text-emerald-700">
                                        Current entitlements
                                    </p>
                                ) : (
                                    <p className="text-[12px] text-zinc-500">
                                        {plan.id === 'free'
                                            ? 'Always available — no card needed.'
                                            : 'Unlock with a season pass above.'}
                                    </p>
                                )}
                            </div>
                        </StudioCard>
                    ))}
                </div>

                {(billing.launch_checklist?.length ?? 0) > 0 ? (
                    <StudioCard className="overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-5 py-4">
                            <div>
                                <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                    Launch checklist
                                </p>
                                <p className="mt-1 text-[13px] text-zinc-500">
                                    Ops-only readiness checks for this environment.
                                </p>
                            </div>
                            {billing.is_billing_admin ? (
                                <Link
                                    href="/settings/billing/payments"
                                    className="text-[12px] font-semibold text-zinc-900 underline-offset-2 hover:underline"
                                >
                                    Ops payments →
                                </Link>
                            ) : null}
                        </div>
                        <ul className="divide-y divide-zinc-100">
                            {billing.launch_checklist!.map((item) => (
                                <li key={item.id} className="flex items-start gap-3 px-5 py-3">
                                    {item.done ? (
                                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                    ) : (
                                        <Circle className="mt-0.5 size-4 shrink-0 text-zinc-300" />
                                    )}
                                    <div>
                                        <p className="text-[13px] font-medium text-zinc-900">
                                            {item.label}
                                        </p>
                                        {!item.done ? (
                                            <p className="mt-0.5 text-[12px] text-zinc-500">{item.hint}</p>
                                        ) : null}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </StudioCard>
                ) : null}

                {(billing.recent_payments?.length ?? 0) > 0 ? (
                    <StudioCard className="overflow-hidden">
                        <div className="border-b border-zinc-100 px-5 py-4">
                            <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                                Your receipts
                            </p>
                            <p className="mt-1 text-[13px] text-zinc-500">
                                A confirmation email is sent after each successful payment.
                            </p>
                        </div>
                        <ul className="divide-y divide-zinc-100">
                            {billing.recent_payments!.map((row) => (
                                <li
                                    key={row.id}
                                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[13px]"
                                >
                                    <div>
                                        <p className="font-medium text-zinc-950">
                                            {row.kind === 'season' ? 'Season pass' : 'Credit pack'} ·{' '}
                                            {row.sku}
                                        </p>
                                        <p className="text-[12px] text-zinc-500">
                                            {row.status}
                                            {row.payment_id ? ` · ${row.payment_id}` : ''}
                                        </p>
                                    </div>
                                    <p className="font-serif text-lg tabular-nums text-zinc-950">
                                        {row.amount_label}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </StudioCard>
                ) : null}

                <StudioCard>
                    <div className="border-b border-zinc-100 px-5 py-4">
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
                            Add-ons
                        </p>
                        <h3 className="mt-1 font-serif text-xl text-zinc-950">Message credit packs</h3>
                        <p className="mt-1 text-[13px] text-zinc-500">
                            Top up WhatsApp/SMS sends. Pay with UPI, cards, or netbanking where available.
                        </p>
                    </div>
                    <ul className="divide-y divide-zinc-100">
                        {billing.packs.map((pack) => (
                            <li
                                key={pack.id}
                                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                                        <Wallet className="size-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-semibold text-zinc-950">
                                            {pack.name}
                                        </p>
                                        <p className="text-[12px] text-zinc-500">
                                            {pack.price_label}
                                            {pack.price_note ? ` · ${pack.price_note}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                                    {pack.checkout_ready ? (
                                        <Button
                                            type="button"
                                            className={cn(
                                                'h-10 w-full rounded-full sm:h-9 sm:w-auto',
                                                checkoutBusy &&
                                                    payingSku !== pack.id &&
                                                    'pointer-events-none',
                                            )}
                                            disabled={payingSku === pack.id}
                                            aria-busy={payingSku === pack.id || undefined}
                                            onClick={() => void payPack(pack.id)}
                                        >
                                            {payingSku === pack.id
                                                ? 'Opening checkout…'
                                                : `Pay ${pack.price_label}`}
                                        </Button>
                                    ) : null}
                                </div>
                            </li>
                        ))}
                    </ul>
                </StudioCard>
            </div>
        </>
    );
}
