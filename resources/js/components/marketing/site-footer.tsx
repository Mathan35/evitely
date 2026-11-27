import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { BrandMark } from '@/components/brand-mark';
import { InstallAppButton } from '@/components/install-app-button';

const eventTypes: Array<[string, string]> = [
    ['/designs/wedding', 'Wedding'],
    ['/designs/birthday', 'Birthday'],
    ['/designs/corporate', 'Corporate'],
    ['/designs/baby-shower', 'Baby Shower'],
    ['/designs/party', 'Party'],
    ['/designs/graduation', 'Graduation'],
    ['/designs/bridal-shower', 'Bridal Shower'],
    ['/designs/housewarming', 'Housewarming'],
    ['/designs/custom', 'Custom'],
];

type FooterSocial = {
    network: string;
    label: string;
    url: string;
};

export function SiteFooter() {
    const { footerSocial = [] } = usePage().props as { footerSocial?: FooterSocial[] };

    return (
        <footer className="bg-[#1c1916] text-[#f6f1e8]">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <BrandMark light className="text-2xl sm:text-3xl" iconClassName="h-8 w-8 sm:h-10 sm:w-10" />
                    <p className="mt-3 max-w-[16rem] text-sm leading-6 text-[#f6f1e8]/70">
                        Craft premium digital invites for every celebration — cards, websites, and RSVP in one place.
                    </p>
                </div>
                <FooterColumn
                    title="Quick Links"
                    links={[
                        ['/', 'Home'],
                        ['/designs', 'All Event Types'],
                        ['/events?create=1', 'Create Invite'],
                        ['/#get-app', 'Install app'],
                        ['/#planning', 'Planning Tools'],
                        ['/#pricing', 'Pricing'],
                        ['/support', 'Support'],
                        ['/coupons', 'Coupons'],
                    ]}
                />
                <FooterColumn title="Event Types" links={eventTypes} />
                <div>
                    <p className="text-xs tracking-[0.18em] uppercase">Legal</p>
                    <ul className="mt-3 space-y-2 text-sm text-[#f6f1e8]/80">
                        <li>
                            <Link href="/privacy" className="hover:text-[#f6f1e8]">
                                Privacy
                            </Link>
                        </li>
                        <li>
                            <Link href="/terms" className="hover:text-[#f6f1e8]">
                                Terms
                            </Link>
                        </li>
                        <li>
                            <Link href="/refund" className="hover:text-[#f6f1e8]">
                                Refunds
                            </Link>
                        </li>
                        <li>
                            <Link href="/cancellation" className="hover:text-[#f6f1e8]">
                                Cancellation
                            </Link>
                        </li>
                        <li>
                            <Link href="/cookies" className="hover:text-[#f6f1e8]">
                                Cookies
                            </Link>
                        </li>
                        <li>
                            <Link href="/coupons" className="hover:text-[#f6f1e8]">
                                Coupons
                            </Link>
                        </li>
                        <li>
                            <Link href="/support" className="hover:text-[#f6f1e8]">
                                Support
                            </Link>
                        </li>
                    </ul>
                    <p className="mt-6 text-xs tracking-[0.18em] uppercase">Get the app</p>
                    <div className="mt-3">
                        <InstallAppButton
                            variant="outline"
                            className="[&_button]:border-white/20 [&_button]:bg-white/5 [&_button]:text-[#f6f1e8] [&_button]:hover:border-[#c6a36a]/50 [&_button]:hover:bg-white/10"
                        />
                    </div>
                    {footerSocial.length > 0 ? (
                        <>
                            <p className="mt-6 text-xs tracking-[0.18em] uppercase">Social</p>
                            <div className="mt-4 flex gap-3">
                                {footerSocial.map((item) => (
                                    <SocialBadge key={item.network} label={item.label} href={item.url}>
                                        <SocialIcon network={item.network} />
                                    </SocialBadge>
                                ))}
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
            <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-[#f6f1e8]/50">
                © 2026 Invidora. All rights reserved.
            </p>
        </footer>
    );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
    return (
        <div>
            <p className="text-xs tracking-[0.18em] uppercase">{title}</p>
            <ul className="mt-3 space-y-2 text-sm text-[#f6f1e8]/80">
                {links.map(([href, label]) => (
                    <li key={href}>
                        <Link href={href} className="hover:text-[#f6f1e8]">
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function SocialBadge({
    label,
    href,
    children,
}: {
    label: string;
    href: string;
    children: ReactNode;
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/20 transition hover:border-[#c6a36a]/60 hover:bg-white/5"
            title={label}
            aria-label={label}
        >
            {children}
        </a>
    );
}

function SocialIcon({ network }: { network: string }) {
    if (network === 'instagram') {
        return <InstagramIcon />;
    }
    if (network === 'facebook') {
        return <FacebookIcon />;
    }
    if (network === 'linkedin') {
        return <LinkedInIcon />;
    }
    return null;
}

function InstagramIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" aria-hidden>
            <rect x="4" y="4" width="16" height="16" rx="4" />
            <circle cx="12" cy="12" r="3.5" />
            <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
    );
}

function FacebookIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
            <path d="M14.2 20.5v-6.3h2.1l.3-2.4h-2.4V10.2c0-.7.2-1.2 1.2-1.2h1.3V6.9c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.1-3.2 3.3v1.8H9.2v2.4h2.4v6.2h2.6Z" />
        </svg>
    );
}

function LinkedInIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
            <path d="M6.9 9.3H4.2V19h2.7V9.3ZM5.55 4.5A1.55 1.55 0 1 0 5.56 7.6 1.55 1.55 0 0 0 5.55 4.5ZM19.8 19h-2.68v-5.1c0-1.4-.55-2.15-1.6-2.15-.9 0-1.4.6-1.63 1.18-.09.22-.08.52-.08.83V19H11.1s.04-8.6 0-9.7h2.7v1.55c.36-.55 1-1.34 2.45-1.34 1.8 0 3.15 1.17 3.15 3.7V19Z" />
        </svg>
    );
}
