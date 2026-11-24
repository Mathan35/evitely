import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { SiteFrame } from '@/components/marketing/site-frame';

export function LegalPage({
    title,
    updatedAt,
    appName,
    children,
}: {
    title: string;
    updatedAt: string;
    appName: string;
    children: ReactNode;
}) {
    return (
        <SiteFrame>
            <main className="mx-auto w-full max-w-3xl px-4 py-14">
                <p className="text-[11px] tracking-[0.2em] text-[#8a7d6e] uppercase">{appName}</p>
                <h1 className="mt-3 font-serif text-4xl tracking-tight text-[#1c1712] sm:text-5xl">{title}</h1>
                <p className="mt-3 text-sm text-[#5e554c]">Last updated {updatedAt}</p>
                <div className="legal-prose mt-10 space-y-4 text-[15px] leading-7 text-[#2b241c] [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:tracking-tight [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                    {children}
                </div>
                <p className="mt-12 text-sm text-[#5e554c]">
                    Also see{' '}
                    <Link href="/privacy" className="underline underline-offset-2">
                        Privacy
                    </Link>
                    ,{' '}
                    <Link href="/terms" className="underline underline-offset-2">
                        Terms
                    </Link>
                    , and{' '}
                    <Link href="/cookies" className="underline underline-offset-2">
                        Cookies
                    </Link>
                    .
                </p>
            </main>
        </SiteFrame>
    );
}
