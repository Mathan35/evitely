import { Link, usePage } from '@inertiajs/react';
import { BrandMark } from '@/components/brand-mark';
import { MarketingHeader } from '@/components/marketing/marketing-header';

type FooterSocial = {
    network: string;
    label: string;
    url: string;
};

export function SiteFrame({
    children,
}: {
    children: React.ReactNode;
    canRegister?: boolean;
}) {
    const { footerSocial = [] } = usePage().props as { footerSocial?: FooterSocial[] };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <MarketingHeader />
            {children}
            <footer className="border-t border-[#1c1712]/10">
                <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <BrandMark />
                        <p className="mt-4 max-w-xs text-sm leading-6 text-[#1c1712]/70">
                            One platform. Every celebration. Beautifully invited.
                        </p>
                        {footerSocial.length > 0 ? (
                            <div className="mt-5 flex flex-wrap gap-2.5">
                                {footerSocial.map((item) => (
                                    <a
                                        key={item.network}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="grid h-9 w-9 place-items-center rounded-full border border-[#1c1712]/15 text-[#1c1712]/75 transition hover:border-[#1c1712]/35 hover:text-[#1c1712]"
                                        title={item.label}
                                        aria-label={item.label}
                                    >
                                        <FrameSocialIcon network={item.network} />
                                    </a>
                                ))}
                            </div>
                        ) : null}
                    </div>
                    <FooterColumn
                        title="Product"
                        links={[
                            ['/designs', 'Templates'],
                            ['/birthday-invitation', 'Birthday'],
                            ['/baby-invitation', 'Baby'],
                            ['/housewarming-invitation', 'Housewarming'],
                            ['/corporate-invitation', 'Corporate'],
                            ['/graduation-invitation', 'Graduation'],
                            ['/party-invitation', 'Party'],
                            ['/religious-invitation', 'Religious'],
                        ]}
                    />
                    <FooterColumn
                        title="Celebrations"
                        links={[
                            ['/indian-wedding-invitation', 'Indian weddings'],
                            ['/south-indian-wedding-invitation', 'South Indian'],
                            ['/punjabi-wedding-invitation', 'Punjabi'],
                            ['/destination-wedding-invitation', 'Destination'],
                            ['/luxury-wedding-invitation', 'Luxury'],
                        ]}
                    />
                    <FooterColumn
                        title="Help & legal"
                        links={[
                            ['/support', 'Support'],
                            ['/coupons', 'Coupons'],
                            ['/privacy', 'Privacy'],
                            ['/terms', 'Terms'],
                            ['/refund', 'Refunds'],
                            ['/cancellation', 'Cancellation'],
                            ['/cookies', 'Cookies'],
                        ]}
                    />
                </div>
                <p className="mx-auto w-full max-w-6xl px-4 pb-8 text-xs tracking-[0.14em] text-[#1c1712]/50 uppercase">
                    Create. Customize. Share.
                </p>
            </footer>
        </div>
    );
}

function FrameSocialIcon({ network }: { network: string }) {
    if (network === 'instagram') {
        return (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" aria-hidden>
                <rect x="4" y="4" width="16" height="16" rx="4" />
                <circle cx="12" cy="12" r="3.5" />
                <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
            </svg>
        );
    }
    if (network === 'facebook') {
        return (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
                <path d="M14.2 20.5v-6.3h2.1l.3-2.4h-2.4V10.2c0-.7.2-1.2 1.2-1.2h1.3V6.9c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.1-3.2 3.3v1.8H9.2v2.4h2.4v6.2h2.6Z" />
            </svg>
        );
    }
    if (network === 'linkedin') {
        return (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
                <path d="M6.9 9.3H4.2V19h2.7V9.3ZM5.55 4.5A1.55 1.55 0 1 0 5.56 7.6 1.55 1.55 0 0 0 5.55 4.5ZM19.8 19h-2.68v-5.1c0-1.4-.55-2.15-1.6-2.15-.9 0-1.4.6-1.63 1.18-.09.22-.08.52-.08.83V19H11.1s.04-8.6 0-9.7h2.7v1.55c.36-.55 1-1.34 2.45-1.34 1.8 0 3.15 1.17 3.15 3.7V19Z" />
            </svg>
        );
    }
    return null;
}

function FooterColumn({
    title,
    links,
}: {
    title: string;
    links: Array<[string, string]>;
}) {
    return (
        <div>
            <p className="text-xs tracking-[0.18em] uppercase">{title}</p>
            <ul className="mt-4 space-y-2 text-sm">
                {links.map(([href, label]) => (
                    <li key={href}>
                        <Link href={href} className="hover:underline">
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
