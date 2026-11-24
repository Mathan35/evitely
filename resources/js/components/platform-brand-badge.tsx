import { Link } from '@inertiajs/react';
import { BrandMarkIcon } from '@/components/brand-mark-icon';
import { cn } from '@/lib/utils';

/** Shown on public invitations unless the site pack unlocks remove_branding. */
export function PlatformBrandBadge({
    hidden = false,
    href = '/register',
    className,
}: {
    hidden?: boolean;
    /** Host referral signup URL when available. */
    href?: string;
    className?: string;
}) {
    if (hidden) {
        return null;
    }

    return (
        <div className={cn('pointer-events-none fixed inset-x-0 bottom-0 z-[25] flex justify-center pb-3', className)}>
            <Link
                href={href}
                className="pointer-events-auto inline-flex max-w-[min(100%-1.5rem,22rem)] items-center gap-1.5 rounded-full bg-zinc-950/85 px-3.5 py-2 text-[11px] font-medium text-white shadow-lg shadow-zinc-950/25 ring-1 ring-white/15 backdrop-blur transition hover:bg-zinc-900"
            >
                <BrandMarkIcon tone="light" className="h-3.5 w-3.5 shrink-0" />
                <span className="leading-tight">
                    <span className="tracking-[0.12em] text-white/70 uppercase">Made with Evitely</span>
                    <span className="mt-0.5 block text-[12px] font-semibold tracking-normal normal-case">
                        Make yours free →
                    </span>
                </span>
            </Link>
        </div>
    );
}

export function shouldHidePlatformBrand(siteBilling?: {
    features?: Record<string, boolean> | null;
    has_paid_pack?: boolean;
    legacy_account_pro?: boolean;
} | null): boolean {
    if (!siteBilling) {
        return false;
    }
    if (siteBilling.features?.remove_branding === true) {
        return true;
    }
    // Paid site or legacy Pro still gets brand-free public pages.
    return Boolean(siteBilling.has_paid_pack || siteBilling.legacy_account_pro);
}
