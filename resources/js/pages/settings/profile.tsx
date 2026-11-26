import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { BadgeCheck, Copy, Mail, Ticket } from 'lucide-react';
import { useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { StudioCard, StudioEyebrow } from '@/components/studio/studio-surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import { copyToClipboard } from '@/lib/clipboard';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type SiteCoupon = {
    id: number;
    code: string;
    percent_off: number;
    label: string;
    status: string;
};

type PageProps = {
    auth: Auth;
    growth?: {
        referral_url?: string | null;
        referral_code?: string | null;
        referral_coupon_percent?: number;
        coupons?: SiteCoupon[];
        has_site_coupon?: boolean;
    };
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth, growth } = usePage<PageProps>().props;
    const user = auth.user;
    const getInitials = useInitials();
    const [copied, setCopied] = useState(false);
    const coupons = growth?.coupons ?? [];
    const referralUrl = growth?.referral_url || '/register';
    const couponPercent = growth?.referral_coupon_percent ?? 50;

    if (!user) {
        return null;
    }

    const verified = Boolean(user.email_verified_at);

    async function copyReferral(): Promise<void> {
        const ok = await copyToClipboard(referralUrl);
        if (!ok) {
            // Last-ditch: select the field so the user can Ctrl/Cmd+C.
            const input = document.querySelector<HTMLInputElement>('[data-referral-url]');
            input?.focus();
            input?.select();
            return;
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    }

    return (
        <>
            <Head title="Profile" />

            <div className="min-w-0 space-y-5 sm:space-y-6">
                <StudioCard className="overflow-hidden">
                    <div className="relative overflow-hidden border-b border-zinc-950/8 bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950 px-4 py-6 text-white sm:px-6 sm:py-7 dark:border-white/10">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-emerald-400/20 blur-3xl"
                        />
                        <div className="relative flex items-start gap-4">
                            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-lg font-semibold tracking-wide ring-1 ring-white/15 backdrop-blur sm:size-16 sm:text-xl">
                                {getInitials(user.name)}
                            </span>
                            <div className="min-w-0">
                                <StudioEyebrow>
                                    <span className="text-white/60">Identity</span>
                                </StudioEyebrow>
                                <h2 className="mt-1.5 truncate font-serif text-[1.75rem] leading-none tracking-tight sm:text-3xl">
                                    {user.name}
                                </h2>
                                <p className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-white/70">
                                    <Mail className="size-3.5 shrink-0" aria-hidden />
                                    <span className="min-w-0 break-all">{user.email}</span>
                                    {verified ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-emerald-300 uppercase ring-1 ring-emerald-400/25">
                                            <BadgeCheck className="size-3" />
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
                                            Unverified
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        <h3 className="font-serif text-xl tracking-tight text-zinc-950 sm:text-2xl dark:text-white">
                            Profile details
                        </h3>
                        <p className="mt-1 text-sm text-pretty text-zinc-500">
                            Update the name and email guests and collaborators see on your account.
                        </p>

                        <Form
                            {...ProfileController.update.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            className="mt-6 space-y-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                className="h-11 rounded-xl"
                                                defaultValue={user.name}
                                                name="name"
                                                required
                                                autoComplete="name"
                                                placeholder="Full name"
                                            />
                                            <InputError className="mt-1" message={errors.name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                className="h-11 rounded-xl"
                                                defaultValue={user.email}
                                                name="email"
                                                required
                                                autoComplete="username"
                                                placeholder="Email address"
                                            />
                                            <InputError className="mt-1" message={errors.email} />
                                        </div>
                                    </div>

                                    {mustVerifyEmail &&
                                        (user.email_verified_at === null ? (
                                            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-400/20 dark:bg-amber-500/10">
                                                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                                    Email verification
                                                </p>
                                                <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-100/70">
                                                    Optional. You can use the studio now, and confirm this address whenever you are ready.
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    className="mt-3 h-auto px-0 text-amber-900 dark:text-amber-200"
                                                    onClick={() =>
                                                        router.post(
                                                            send.url(),
                                                            {},
                                                            { preserveScroll: true },
                                                        )
                                                    }
                                                >
                                                    Send verification email
                                                </Button>
                                                {status === 'verification-link-sent' ? (
                                                    <div className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                                        A verification link has been sent to your email address.
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <p className="inline-flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
                                                <BadgeCheck className="size-4" />
                                                This email address is verified.
                                            </p>
                                        ))}

                                    <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                                        <Button
                                            disabled={processing}
                                            data-test="update-profile-button"
                                            className="h-11 w-full rounded-full bg-zinc-950 px-5 text-white hover:bg-zinc-800 sm:w-auto"
                                        >
                                            Save changes
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </div>
                </StudioCard>

                <StudioCard className="overflow-hidden">
                    <div className="border-b border-zinc-950/8 bg-gradient-to-br from-violet-50 via-white to-emerald-50 px-4 py-5 sm:px-6 dark:border-white/10 dark:from-violet-950/30 dark:via-zinc-950 dark:to-emerald-950/20">
                        <StudioEyebrow>Referrals & coupons</StudioEyebrow>
                        <h3 className="mt-1.5 font-serif text-xl tracking-tight text-zinc-950 sm:text-2xl dark:text-white">
                            Invite friends, earn site coupons
                        </h3>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                            Share your link. When they publish a guest site, you get a {couponPercent}% off coupon for
                            your next site pack (site cost only — credits stay full price).
                        </p>
                    </div>
                    <div className="space-y-4 p-4 sm:p-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Input
                                readOnly
                                data-referral-url
                                value={referralUrl}
                                className="h-11 rounded-xl font-mono text-[12px]"
                                onFocus={(event) => event.currentTarget.select()}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 shrink-0 rounded-full"
                                onClick={() => void copyReferral()}
                            >
                                <Copy className="mr-1.5 size-3.5" />
                                {copied ? 'Copied' : 'Copy link'}
                            </Button>
                        </div>

                        {coupons.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                    Ready to use
                                </p>
                                {coupons.map((coupon) => (
                                    <div
                                        key={coupon.id}
                                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-violet-50/80 px-4 py-3 ring-1 ring-violet-200/70 dark:bg-violet-950/30 dark:ring-violet-500/20"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="grid size-9 place-items-center rounded-xl bg-white text-violet-700 shadow-sm ring-1 ring-violet-100 dark:bg-zinc-950 dark:text-violet-300">
                                                <Ticket className="size-4" />
                                            </span>
                                            <div>
                                                <p className="text-[13px] font-semibold text-zinc-950 dark:text-white">
                                                    {coupon.label}
                                                </p>
                                                <p className="font-mono text-[11px] text-zinc-500">{coupon.code}</p>
                                            </div>
                                        </div>
                                        <Link
                                            href="/events"
                                            className="inline-flex h-9 items-center rounded-full bg-violet-700 px-3.5 text-[12px] font-semibold text-white"
                                        >
                                            Use on billing
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500 ring-1 ring-zinc-950/5 dark:bg-zinc-900/50 dark:ring-white/10">
                                No site coupons yet — share your referral link to earn one.
                            </p>
                        )}
                    </div>
                </StudioCard>

                <StudioCard className="p-4 sm:p-6">
                    <DeleteUser />
                </StudioCard>
            </div>
        </>
    );
}
