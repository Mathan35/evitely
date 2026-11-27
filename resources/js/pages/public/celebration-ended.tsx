import { Head } from '@inertiajs/react';
import type { CSSProperties } from 'react';
import { BrandMark } from '@/components/brand-mark';

type Photo = { id: number; url: string | null; caption?: string | null };

export default function CelebrationEnded({
    title,
    hosts,
    message,
    date_label: dateLabel,
    city,
    venue_name: venueName,
    photos,
    photo_album_open: photoAlbumOpen,
    theme,
}: {
    slug: string;
    title: string;
    hosts: string[];
    message: string;
    date_label?: string | null;
    city?: string | null;
    venue_name?: string | null;
    photos: Photo[];
    photo_album_open: boolean;
    theme: { paper: string; ink: string; seal: string; accent: string };
}) {
    const hostLine =
        hosts.length >= 2 ? `${hosts[0]} & ${hosts[1]}` : hosts[0] || title;
    const placeLine = [venueName, city].filter(Boolean).join(' · ');
    const album = photoAlbumOpen ? photos.filter((p) => p.url) : [];

    return (
        <>
            <Head title={`${title} · Thank you`} />
            <main
                className="relative flex min-h-dvh flex-col items-center overflow-hidden px-6 py-16 text-center"
                style={
                    {
                        '--paper': theme.paper,
                        '--ink': theme.ink,
                        '--seal': theme.seal,
                        '--accent': theme.accent,
                        background:
                            `radial-gradient(ellipse 90% 70% at 50% 0%, color-mix(in srgb, var(--seal) 28%, transparent), transparent 55%),` +
                            `radial-gradient(ellipse 80% 60% at 20% 100%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 50%),` +
                            `linear-gradient(165deg, color-mix(in srgb, var(--paper) 92%, #0c0a08) 0%, var(--paper) 45%, color-mix(in srgb, var(--paper) 85%, #000) 100%)`,
                        color: 'var(--ink)',
                    } as CSSProperties
                }
            >
                <div className="relative z-[1] flex w-full max-w-2xl flex-col items-center gap-8">
                    <BrandMark className="!text-[color:var(--ink)] opacity-90" />
                    <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-700">
                        <p
                            className="text-[11px] font-semibold tracking-[0.22em] uppercase"
                            style={{ color: 'color-mix(in srgb, var(--ink) 65%, transparent)' }}
                        >
                            Celebration closed
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
                        <p className="mt-2 max-w-lg text-[15px] leading-relaxed opacity-90">{message}</p>
                    </div>

                    {album.length > 0 ? (
                        <section className="w-full animate-in fade-in duration-1000">
                            <p className="mb-4 text-[11px] font-semibold tracking-[0.18em] text-[color:var(--ink)]/60 uppercase">
                                Photo memories
                            </p>
                            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {album.map((photo) => (
                                    <li
                                        key={photo.id}
                                        className="overflow-hidden rounded-xl ring-1 ring-white/10"
                                    >
                                        <img
                                            src={photo.url!}
                                            alt={photo.caption || 'Guest photo'}
                                            className="aspect-square w-full object-cover"
                                            loading="lazy"
                                        />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}
                </div>
            </main>
        </>
    );
}
