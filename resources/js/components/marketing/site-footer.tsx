import { Link } from '@inertiajs/react';
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

export function SiteFooter() {
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
                            <Link href="/cookies" className="hover:text-[#f6f1e8]">
                                Cookies
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
                    <p className="mt-6 text-xs tracking-[0.18em] uppercase">Social</p>
                    <div className="mt-4 flex gap-3">
                        <SocialBadge label="Instagram">
                            <InstagramIcon />
                        </SocialBadge>
                        <SocialBadge label="Pinterest">
                            <PinterestIcon />
                        </SocialBadge>
                        <SocialBadge label="Facebook">
                            <FacebookIcon />
                        </SocialBadge>
                    </div>
                </div>
            </div>
            <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-[#f6f1e8]/50">© 2026 Invidora. All rights reserved.</p>
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

function SocialBadge({ label, children }: { label: string; children: ReactNode }) {
    return (
        <span className="grid h-10 w-10 place-items-center rounded-full border border-white/20" title={label} aria-label={label}>
            {children}
        </span>
    );
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

function PinterestIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
            <path d="M12 3.2A8.8 8.8 0 0 0 8.1 19.7c-.1-.7-.2-1.8 0-2.6l1.5-6.2s-.4-.8-.4-1.9c0-1.8 1-3.1 2.3-3.1 1.1 0 1.6.8 1.6 1.8 0 1.1-.7 2.7-1 4.2-.3 1.2.6 2.2 1.8 2.2 2.2 0 3.6-2.8 3.6-6.1 0-2.5-1.7-4.4-4.8-4.4-3.5 0-5.7 2.6-5.7 5.5 0 1 .4 2.1.9 2.7.1.1.1.2.1.3l-.3 1.3c0 .2-.2.3-.4.2-1.4-.6-2-2.2-2-4 0-3.3 2.8-7.3 8.3-7.3 4.4 0 7.3 3.2 7.3 6.6 0 4.5-2.5 7.9-6.2 7.9-1.2 0-2.4-.7-2.8-1.4l-.8 2.9c-.2.9-.8 1.9-1.2 2.6A8.8 8.8 0 1 0 12 3.2Z" />
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
