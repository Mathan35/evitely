import { Link } from '@inertiajs/react';
import { BrandMark } from '@/components/brand-mark';
import { MarketingHeader } from '@/components/marketing/marketing-header';

export function SiteFrame({
    children,
}: {
    children: React.ReactNode;
    canRegister?: boolean;
}) {
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
                            ['/privacy', 'Privacy'],
                            ['/terms', 'Terms'],
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
