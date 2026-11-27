import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';
import { MarketingSeoHead, type MarketingSeoPayload } from '@/components/marketing/marketing-seo-head';
import { SiteFrame } from '@/components/marketing/site-frame';

type OwnedCoupon = {
    id: number;
    code: string;
    discount_type: string;
    percent_off?: number | null;
    amount_off_minor?: number | null;
    label: string;
    status: string;
    expires_at?: string | null;
};

type Campaign = {
    id: number;
    code: string;
    title: string;
    description?: string | null;
    discount_type: string;
    discount_label: string;
    ends_at?: string | null;
    claims_remaining: number;
    claimable: boolean;
    owned?: OwnedCoupon | null;
};

export default function CouponsIndex({
    appName,
    authRequired,
    campaigns = [],
    my_coupons = [],
    seo,
}: {
    appName: string;
    authRequired: boolean;
    campaigns?: Campaign[];
    my_coupons?: OwnedCoupon[];
    seo?: MarketingSeoPayload;
}) {
    const offerList = Array.isArray(campaigns) ? campaigns : [];
    const mine = Array.isArray(my_coupons) ? my_coupons : [];
    const page = usePage();
    const claim = useForm({ code: '' });

    function submitClaim(event: FormEvent) {
        event.preventDefault();
        claim.post('/coupons/claim', { preserveScroll: true });
    }

    function claimCode(code: string) {
        claim.setData('code', code);
        claim.transform(() => ({ code }));
        claim.post('/coupons/claim', { preserveScroll: true });
    }

    return (
        <>
            <Head title={`Coupons · ${appName}`} />
            {seo ? <MarketingSeoHead seo={seo} /> : null}
            <SiteFrame>
                <main className="mx-auto w-full max-w-4xl px-4 py-14">
                    <p className="text-[11px] tracking-[0.2em] text-[#8a7d6e] uppercase">{appName}</p>
                    <h1 className="mt-3 font-serif text-4xl tracking-tight text-[#1c1712] sm:text-5xl">
                        Coupons &amp; offers
                    </h1>
                    <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5e554c]">
                        Save a coupon, then apply it on your event’s billing page. Discounts apply to the site pack
                        price; message credits stay full price.
                    </p>

                    {authRequired ? (
                        <div className="mt-8 rounded-2xl border border-[#e8dfd2] bg-[#fbf7f0] p-5">
                            <p className="text-sm text-[#3d342c]">
                                Sign in to claim offers and see coupons saved to your account.
                            </p>
                            <Link
                                href="/login"
                                className="mt-3 inline-flex h-10 items-center rounded-full bg-[#1c1712] px-4 text-[13px] font-semibold text-[#f6f1e8]"
                            >
                                Sign in
                            </Link>
                        </div>
                    ) : (
                        <form
                            onSubmit={submitClaim}
                            className="mt-8 flex flex-col gap-3 rounded-2xl border border-[#e8dfd2] bg-white p-4 sm:flex-row sm:items-end"
                        >
                            <div className="min-w-0 flex-1">
                                <label className="text-[11px] font-medium tracking-[0.14em] text-[#8a7d6e] uppercase">
                                    Have a code?
                                </label>
                                <input
                                    className="mt-1 h-11 w-full rounded-xl border border-[#e4d9c8] bg-[#fcfaf6] px-3 font-mono text-sm tracking-wide text-[#1c1712]"
                                    value={claim.data.code}
                                    onChange={(e) => claim.setData('code', e.target.value.toUpperCase())}
                                    placeholder="ENTER-CODE"
                                    required
                                />
                                {claim.errors.code ? (
                                    <p className="mt-1 text-[12px] text-rose-700">{claim.errors.code}</p>
                                ) : null}
                            </div>
                            <button
                                type="submit"
                                disabled={claim.processing}
                                className="inline-flex h-11 items-center justify-center rounded-full bg-[#1c1712] px-5 text-[13px] font-semibold text-[#f6f1e8] disabled:opacity-50"
                            >
                                {claim.processing ? 'Saving…' : 'Save coupon'}
                            </button>
                        </form>
                    )}

                    {!authRequired && mine.length > 0 ? (
                        <section className="mt-10">
                            <h2 className="font-serif text-2xl text-[#1c1712]">Your saved coupons</h2>
                            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                                {mine.map((coupon) => (
                                    <li
                                        key={coupon.id}
                                        className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-4"
                                    >
                                        <p className="text-[11px] font-semibold tracking-[0.16em] text-emerald-800/80 uppercase">
                                            Ready to use
                                        </p>
                                        <p className="mt-1 font-serif text-xl text-[#1c1712]">{coupon.label}</p>
                                        <p className="mt-1 font-mono text-[12px] text-[#5e554c]">{coupon.code}</p>
                                        {coupon.expires_at ? (
                                            <p className="mt-2 text-[12px] text-[#8a7d6e]">
                                                Expires {new Date(coupon.expires_at).toLocaleString()}
                                            </p>
                                        ) : null}
                                        <Link
                                            href="/events"
                                            className="mt-3 inline-flex text-[13px] font-semibold text-emerald-900 underline-offset-2 hover:underline"
                                        >
                                            Apply on an event →
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    <section className="mt-12">
                        <h2 className="font-serif text-2xl text-[#1c1712]">Current offers</h2>
                        {offerList.length === 0 ? (
                            <p className="mt-4 text-sm text-[#5e554c]">No public offers right now. Check back soon.</p>
                        ) : (
                            <ul className="mt-4 grid gap-4">
                                {offerList.map((campaign) => (
                                    <li
                                        key={campaign.id}
                                        className="rounded-2xl border border-[#e8dfd2] bg-[#fcfaf6] p-5"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#8a7d6e] uppercase">
                                                    {campaign.discount_label}
                                                </p>
                                                <h3 className="mt-1 font-serif text-2xl text-[#1c1712]">
                                                    {campaign.title}
                                                </h3>
                                                {campaign.description ? (
                                                    <p className="mt-2 text-sm leading-6 text-[#5e554c]">
                                                        {campaign.description}
                                                    </p>
                                                ) : null}
                                                <p className="mt-2 font-mono text-[12px] text-[#3d342c]">
                                                    Code {campaign.code}
                                                </p>
                                                <p className="mt-1 text-[12px] text-[#8a7d6e]">
                                                    {campaign.claims_remaining} claim
                                                    {campaign.claims_remaining === 1 ? '' : 's'} left
                                                    {campaign.ends_at
                                                        ? ` · until ${new Date(campaign.ends_at).toLocaleDateString()}`
                                                        : ''}
                                                </p>
                                            </div>
                                            {authRequired ? (
                                                <Link
                                                    href="/login"
                                                    className="inline-flex h-10 items-center rounded-full bg-[#1c1712] px-4 text-[13px] font-semibold text-[#f6f1e8]"
                                                >
                                                    Sign in to claim
                                                </Link>
                                            ) : campaign.owned ? (
                                                <span className="inline-flex h-10 items-center rounded-full bg-emerald-100 px-4 text-[13px] font-semibold text-emerald-900">
                                                    Saved
                                                </span>
                                            ) : campaign.claimable ? (
                                                <button
                                                    type="button"
                                                    disabled={claim.processing}
                                                    onClick={() => claimCode(campaign.code)}
                                                    className="inline-flex h-10 items-center rounded-full bg-[#1c1712] px-4 text-[13px] font-semibold text-[#f6f1e8] disabled:opacity-50"
                                                >
                                                    Claim
                                                </button>
                                            ) : (
                                                <span className="inline-flex h-10 items-center rounded-full bg-[#efe8dc] px-4 text-[13px] font-medium text-[#5e554c]">
                                                    Unavailable
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {(page.props as { flash?: { toast?: { message?: string } } }).flash?.toast?.message ? (
                        <p className="sr-only">
                            {(page.props as { flash?: { toast?: { message?: string } } }).flash?.toast?.message}
                        </p>
                    ) : null}
                </main>
            </SiteFrame>
        </>
    );
}
