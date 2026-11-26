import { Head } from '@inertiajs/react';
import type { CSSProperties } from 'react';
import { BrandMark } from '@/components/brand-mark';

export default function PublicPaused({
    title,
    hosts,
    dateLabel,
    city,
    venueName,
    theme,
}: {
    slug: string;
    title: string;
    hosts: string[];
    dateLabel?: string | null;
    city?: string | null;
    venueName?: string | null;
    theme: {
        paper: string;
        ink: string;
        seal: string;
        accent: string;
    };
}) {
    const hostLine =
        hosts.length >= 2
            ? `${hosts[0]} & ${hosts[1]}`
            : hosts[0] || title;
    const placeLine = [venueName, city].filter(Boolean).join(' · ');

    return (
        <>
            <Head title={`${title} · Temporarily paused`} />
            <main
                className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-16 text-center"
                style={
                    {
                        '--paper': theme.paper,
                        '--ink': theme.ink,
                        '--seal': theme.seal,
                        '--accent': theme.accent,
                        background:
                            `radial-gradient(ellipse 90% 70% at 50% 0%, color-mix(in srgb, var(--seal) 28%, transparent), transparent 55%),` +
                            `radial-gradient(ellipse 80% 60% at 80% 100%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 50%),` +
                            `linear-gradient(165deg, color-mix(in srgb, var(--paper) 92%, #0c0a08) 0%, var(--paper) 45%, color-mix(in srgb, var(--paper) 85%, #000) 100%)`,
                        color: 'var(--ink)',
                    } as CSSProperties
                }
            >
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.12]"
                    style={{
                        backgroundImage:
                            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                    }}
                    aria-hidden
                />

                <div className="relative z-[1] flex w-full max-w-lg flex-col items-center gap-8">
                    <BrandMark className="!text-[color:var(--ink)] opacity-90" />

                    <div className="flex flex-col items-center gap-3">
                        <p
                            className="text-[11px] font-semibold tracking-[0.22em] uppercase"
                            style={{ color: 'color-mix(in srgb, var(--ink) 65%, transparent)' }}
                        >
                            Invitation paused
                        </p>
                        <h1
                            className="font-serif text-[clamp(2rem,6vw,3.25rem)] leading-[1.1] tracking-tight"
                            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                        >
                            {hostLine}
                        </h1>
                        {(dateLabel || placeLine) && (
                            <p
                                className="max-w-md text-[15px] leading-relaxed"
                                style={{ color: 'color-mix(in srgb, var(--ink) 72%, transparent)' }}
                            >
                                {[dateLabel, placeLine].filter(Boolean).join(' · ')}
                            </p>
                        )}
                    </div>

                    <div
                        className="h-px w-16"
                        style={{ background: 'color-mix(in srgb, var(--seal) 70%, transparent)' }}
                        aria-hidden
                    />

                    <div className="flex max-w-md flex-col gap-3">
                        <p className="text-[17px] leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                            This guest site isn’t live right now.
                        </p>
                        <p
                            className="text-[14px] leading-relaxed"
                            style={{ color: 'color-mix(in srgb, var(--ink) 68%, transparent)' }}
                        >
                            The hosts have temporarily paused the invitation. When they go live again, this link will
                            open the full celebration page.
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}
