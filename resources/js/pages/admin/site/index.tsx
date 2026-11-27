import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, ExternalLink, Facebook, Instagram, Linkedin, Share2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/admin-ui';
import { cn } from '@/lib/utils';

type SocialLink = {
    network: string;
    label: string;
    url: string;
    enabled: boolean;
};

type Props = {
    social: SocialLink[];
    public_preview: Array<{ network: string; label: string; url: string }>;
};

const field =
    'mt-1.5 flex h-11 w-full items-center rounded-xl border border-zinc-200/90 bg-white px-3.5 text-[13.5px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10';

function NetworkIcon({ network, className }: { network: string; className?: string }) {
    if (network === 'instagram') {
        return <Instagram className={className} />;
    }
    if (network === 'facebook') {
        return <Facebook className={className} />;
    }
    if (network === 'linkedin') {
        return <Linkedin className={className} />;
    }
    return <Share2 className={className} />;
}

export default function SiteSettingsIndex({ social, public_preview }: Props) {
    const form = useForm({
        links: social.map((row) => ({
            network: row.network,
            url: row.url,
            enabled: row.enabled,
        })),
    });
    const [entered, setEntered] = useState(false);

    useEffect(() => {
        const id = window.requestAnimationFrame(() => setEntered(true));
        return () => window.cancelAnimationFrame(id);
    }, []);

    const enabledCount = form.data.links.filter((l) => l.enabled && l.url.trim()).length;

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/admin/site/social', { preserveScroll: true });
    }

    return (
        <>
            <Head title="Site & footer" />
            <div
                className={cn(
                    'transition duration-500 ease-out',
                    entered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
                )}
            >
                <AdminPageHeader
                    title="Site & footer"
                    description="Manage marketing footer social icons — LinkedIn, Instagram, Facebook. Disable to hide an icon without deleting its URL."
                />

                <div className="mb-5 overflow-hidden rounded-[1.5rem] border border-zinc-950/10 bg-zinc-950 text-zinc-50">
                    <div
                        aria-hidden
                        className="h-1.5 bg-gradient-to-r from-sky-400 via-violet-400 to-rose-400"
                    />
                    <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-6">
                        <div>
                            <p className="text-[10px] font-semibold tracking-[0.2em] text-zinc-400 uppercase">
                                Footer social
                            </p>
                            <h2 className="mt-2 font-serif text-[clamp(1.5rem,3vw,2.1rem)] leading-none tracking-tight">
                                Brand presence
                            </h2>
                            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-zinc-400">
                                Only enabled networks with a URL appear on the public footer. Toggle Off to hide
                                an icon instantly.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <p className="text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
                                Visible now
                            </p>
                            <p className="mt-1 font-serif text-2xl tabular-nums">
                                {public_preview.length}
                                <span className="ml-2 text-[13px] font-sans font-medium text-zinc-400">
                                    / {social.length}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
                    <div className="space-y-3">
                        {form.data.links.map((link, index) => {
                            const meta = social.find((s) => s.network === link.network);
                            const error =
                                (form.errors as Record<string, string>)[`links.${index}.url`] ?? null;
                            return (
                                <section
                                    key={link.network}
                                    className={cn(
                                        'overflow-hidden rounded-[1.35rem] border bg-white shadow-[0_1px_0_rgba(24,24,27,0.03)] transition',
                                        link.enabled
                                            ? 'border-emerald-200/90'
                                            : 'border-zinc-200/90 opacity-95',
                                    )}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3.5 sm:px-5">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span
                                                className={cn(
                                                    'grid size-10 place-items-center rounded-2xl',
                                                    link.enabled
                                                        ? 'bg-zinc-950 text-white'
                                                        : 'bg-zinc-100 text-zinc-500',
                                                )}
                                            >
                                                <NetworkIcon network={link.network} className="size-4" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[14px] font-semibold text-zinc-950">
                                                    {meta?.label ?? link.network}
                                                </p>
                                                <p className="text-[12px] text-zinc-500">
                                                    {link.enabled ? 'Visible in footer' : 'Hidden from footer'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                form.setData(
                                                    'links',
                                                    form.data.links.map((row, i) =>
                                                        i === index
                                                            ? { ...row, enabled: !row.enabled }
                                                            : row,
                                                    ),
                                                )
                                            }
                                            className={cn(
                                                'inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-[12.5px] font-semibold transition',
                                                link.enabled
                                                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                                                    : 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200',
                                            )}
                                        >
                                            {link.enabled ? (
                                                <>
                                                    <Eye className="size-3.5" /> Enabled
                                                </>
                                            ) : (
                                                <>
                                                    <EyeOff className="size-3.5" /> Disabled
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <div className="px-4 py-4 sm:px-5">
                                        <label className="block text-[11px] font-semibold tracking-[0.08em] text-zinc-500 uppercase">
                                            Profile URL
                                            <input
                                                type="url"
                                                value={link.url}
                                                placeholder={`https://${link.network}.com/invidora`}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'links',
                                                        form.data.links.map((row, i) =>
                                                            i === index
                                                                ? { ...row, url: e.target.value }
                                                                : row,
                                                        ),
                                                    )
                                                }
                                                className={field}
                                            />
                                        </label>
                                        {error ? (
                                            <p className="mt-2 text-[12px] text-rose-700">{error}</p>
                                        ) : null}
                                        {link.url.trim() ? (
                                            <a
                                                href={
                                                    /^https?:\/\//i.test(link.url.trim())
                                                        ? link.url.trim()
                                                        : `https://${link.url.trim()}`
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-zinc-500 hover:text-zinc-900"
                                            >
                                                <ExternalLink className="size-3.5" />
                                                Open link
                                            </a>
                                        ) : null}
                                    </div>
                                </section>
                            );
                        })}
                    </div>

                    <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
                        <div className="overflow-hidden rounded-[1.35rem] border border-zinc-200 bg-white p-4 shadow-[0_1px_0_rgba(24,24,27,0.03)]">
                            <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                                Live preview
                            </p>
                            <p className="mt-1 text-[13px] text-zinc-500">
                                How icons render on the dark marketing footer.
                            </p>
                            <div className="mt-4 rounded-2xl bg-[#1c1916] px-4 py-5 text-[#f6f1e8]">
                                <p className="text-[10px] tracking-[0.18em] uppercase opacity-70">Social</p>
                                {enabledCount === 0 ? (
                                    <p className="mt-3 text-[12px] text-[#f6f1e8]/45">
                                        No icons visible — enable at least one with a URL.
                                    </p>
                                ) : (
                                    <div className="mt-3 flex flex-wrap gap-3">
                                        {form.data.links
                                            .filter((l) => l.enabled && l.url.trim())
                                            .map((l) => (
                                                <span
                                                    key={l.network}
                                                    className="grid h-10 w-10 place-items-center rounded-full border border-white/20"
                                                    title={l.network}
                                                >
                                                    <NetworkIcon network={l.network} className="size-4" />
                                                </span>
                                            ))}
                                    </div>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-950 text-[13px] font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
                            >
                                {form.processing ? 'Saving…' : 'Save social links'}
                            </button>
                        </div>
                    </aside>
                </form>
            </div>
        </>
    );
}
