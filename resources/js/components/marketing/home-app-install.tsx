import { Share, Smartphone, Sparkles, Zap } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { BrandMarkIcon } from '@/components/brand-mark-icon';
import { InstallAppButton } from '@/components/install-app-button';
import { usePwaInstall } from '@/hooks/use-pwa-install';

const PERKS = [
    {
        icon: Zap,
        title: 'One-tap studio',
        text: 'Open My Events from your home screen — no hunting through tabs.',
    },
    {
        icon: Smartphone,
        title: 'Feels like an app',
        text: 'Full-screen Invidora with the same invite tools you already use.',
    },
    {
        icon: Sparkles,
        title: 'Same website logo',
        text: 'Your home-screen icon matches the Invidora mark on this site.',
    },
] as const;

export function HomeAppInstall() {
    const { canInstall, installed, iosHint, secure } = usePwaInstall();

    return (
        <section
            id="get-app"
            className="scroll-mt-24 border-y border-[#e7dcc8]/80 bg-[linear-gradient(180deg,#faf6ef_0%,#f3ebe1_48%,#efe6d8_100%)] py-16 sm:py-20"
            aria-labelledby="get-app-heading"
        >
            <div className="mx-auto max-w-6xl px-5">
                <div className="relative overflow-hidden rounded-[1.75rem] bg-[#241c16] text-[#f6f1e8] shadow-[0_40px_80px_-48px_rgba(36,28,22,0.9)]">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_280px_at_85%_0%,rgba(198,163,106,0.28),transparent_58%),radial-gradient(420px_240px_at_10%_100%,rgba(212,137,106,0.16),transparent_55%)]"
                    />

                    <div className="relative grid items-center gap-10 p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:p-10">
                        <div>
                            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#c6a36a] uppercase">
                                Download · Website app
                            </p>
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <span className="grid size-14 place-items-center overflow-hidden rounded-[1.15rem] bg-[#2f2720] ring-1 ring-[#c6a36a]/35 shadow-[0_12px_28px_-16px_rgba(0,0,0,0.8)] sm:size-16">
                                    <img
                                        src="/icons/icon-192.png"
                                        alt=""
                                        width={64}
                                        height={64}
                                        className="size-full object-cover"
                                    />
                                </span>
                                <div>
                                    <BrandMark
                                        light
                                        href="#get-app"
                                        className="pointer-events-none text-xl sm:text-2xl"
                                        iconClassName="h-7 w-7 sm:h-8 sm:w-8"
                                    />
                                    <p className="mt-1 text-sm text-white/55">Free install · No app store · Instant open</p>
                                </div>
                            </div>

                            <h2
                                id="get-app-heading"
                                className="mt-6 max-w-lg font-serif text-3xl tracking-tight sm:text-4xl lg:text-[2.65rem] lg:leading-[1.1]"
                            >
                                Install Invidora on your phone
                            </h2>
                            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/68">
                                Save our website as an app on your home screen. Open guest links, RSVPs, and wishes in
                                one tap — with the same Invidora logo you see in the header.
                            </p>

                            <div className="mt-7 flex flex-wrap items-center gap-3">
                                <InstallAppButton variant="primary" />
                                {installed ? (
                                    <p className="text-sm text-white/55">Ready on this device.</p>
                                ) : canInstall ? (
                                    <p className="text-sm text-white/55">Opens the Chrome install prompt instantly.</p>
                                ) : null}
                            </div>

                            {/* Keep Chrome / Safari guidance visible as a secondary path. */}
                            {!installed ? (
                                <div className="mt-5 max-w-md rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white/70">
                                    {!secure ? (
                                        <>
                                            <p className="font-medium text-[#f6f1e8]">Install needs a secure site</p>
                                            <p className="mt-2">
                                                Open <span className="text-[#f6f1e8]">https://invidora.com</span> in Chrome,
                                                then tap <span className="text-[#f6f1e8]">Install app</span>. Local
                                                http:// sites cannot show the install prompt.
                                            </p>
                                        </>
                                    ) : iosHint ? (
                                        <>
                                            <p className="font-medium text-[#f6f1e8]">Or on iPhone / iPad</p>
                                            <ol className="mt-2 list-decimal space-y-1 pl-4">
                                                <li className="flex flex-wrap items-center gap-1">
                                                    Tap{' '}
                                                    <Share className="mx-0.5 inline size-3.5 text-[#c6a36a]" aria-hidden />{' '}
                                                    Share
                                                </li>
                                                <li>
                                                    Choose <span className="text-[#f6f1e8]">Add to Home Screen</span>
                                                </li>
                                                <li>
                                                    Confirm <span className="text-[#f6f1e8]">Add</span>
                                                </li>
                                            </ol>
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-medium text-[#f6f1e8]">Or install from Chrome</p>
                                            <ol className="mt-2 list-decimal space-y-1 pl-4">
                                                <li>Open the browser menu (⋮)</li>
                                                <li>
                                                    Tap <span className="text-[#f6f1e8]">Install app</span> /{' '}
                                                    <span className="text-[#f6f1e8]">Add to Home screen</span>
                                                </li>
                                                <li>Confirm — uses the Invidora logo above</li>
                                            </ol>
                                        </>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        <div className="relative mx-auto w-full max-w-[19rem]">
                            <div className="absolute -inset-6 rounded-[2rem] bg-[#c6a36a]/10 blur-2xl" aria-hidden />
                            <div className="relative overflow-hidden rounded-[1.85rem] border border-white/10 bg-[#1a1511] p-3 shadow-[0_30px_60px_-28px_rgba(0,0,0,0.85)]">
                                <div className="rounded-[1.35rem] bg-[linear-gradient(165deg,#2b241c_0%,#1c1814_55%,#241c16_100%)] px-5 pt-6 pb-5">
                                    <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-white/15" aria-hidden />
                                    <div className="flex flex-col items-center text-center">
                                        <span className="grid size-[4.5rem] place-items-center rounded-[1.35rem] bg-[#322a22] ring-1 ring-[#c6a36a]/40">
                                            <BrandMarkIcon tone="light" className="h-11 w-11" />
                                        </span>
                                        <p className="mt-4 font-serif text-2xl tracking-tight">Invidora</p>
                                        <p className="mt-1 text-xs tracking-[0.16em] text-[#c6a36a] uppercase">
                                            Invitation studio
                                        </p>
                                        <div className="mt-5 grid w-full gap-2 text-left">
                                            {PERKS.map((perk) => (
                                                <div
                                                    key={perk.title}
                                                    className="flex items-start gap-2.5 rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/6"
                                                >
                                                    <perk.icon className="mt-0.5 size-3.5 shrink-0 text-[#c6a36a]" aria-hidden />
                                                    <div>
                                                        <p className="text-[12px] font-medium text-[#f6f1e8]">{perk.title}</p>
                                                        <p className="mt-0.5 text-[11px] leading-4 text-white/50">{perk.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
