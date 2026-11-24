import type { CSSProperties } from 'react';
import { InvitationCardFace } from '@/components/marketing/invitation-card-face';
import type { GalleryDesign } from '@/types/gallery';

function tone(design: GalleryDesign): CSSProperties {
    return {
        background: design.palette.paper,
        color: design.palette.ink,
        ['--gold' as string]: design.palette.gold,
        ['--accent' as string]: design.palette.accent,
        ['--muted' as string]: design.palette.muted,
    };
}

export function LinkPreview({ design, large = false }: { design: GalleryDesign; large?: boolean }) {
    const sample = design.sample;
    const mods = sample.modules.slice(0, 4);

    return (
        <div className={`mx-auto w-full overflow-hidden ${large ? 'max-w-[280px]' : 'max-w-[148px]'}`}>
            <div className="overflow-hidden rounded-[1.7rem] border-[5px] border-[#1c1916] bg-[#1c1916] p-1.5 shadow-lg">
                <div className="overflow-hidden rounded-[1.25rem]" style={tone(design)}>
                    <div className="mx-auto mt-2 h-2.5 w-12 rounded-full bg-current/20" />
                    <LinkLayout design={design} sample={sample} mods={mods} large={large} />
                </div>
            </div>
        </div>
    );
}

function LinkLayout({
    design,
    sample,
    mods,
    large,
}: {
    design: GalleryDesign;
    sample: GalleryDesign['sample'];
    mods: string[];
    large: boolean;
}) {
    const pad = large ? 'px-4 pb-5 pt-3' : 'px-3 pb-4 pt-2';
    const title = large ? 'text-2xl' : 'text-lg';

    switch (design.layout) {
        case 'dark-luxe':
            return (
                <div className={`${pad} min-h-[220px] text-center`}>
                    <p className="text-[9px] tracking-[0.22em] uppercase opacity-70">{sample.kicker}</p>
                    <h3 className={`mt-2 font-serif ${title} leading-tight`}>{sample.hosts}</h3>
                    <span className="mx-auto mt-3 block h-px w-10" style={{ background: design.palette.gold }} />
                    <p className="mt-3 text-[10px] opacity-80">{sample.when}</p>
                    <p className="mt-1 text-[10px]" style={{ color: design.palette.gold }}>{sample.where}</p>
                    <button type="button" className="mt-4 w-full rounded-full py-1.5 text-[10px] text-white" style={{ background: design.palette.gold }}>
                        RSVP
                    </button>
                </div>
            );
        case 'split-photo':
            return (
                <div className="grid min-h-[220px] grid-cols-2">
                    <div className="min-h-[220px]" style={{ background: design.palette.accent }} />
                    <div className={`${pad}`}>
                        <p className="text-[8px] tracking-[0.16em] uppercase opacity-60">Live site</p>
                        <h3 className={`mt-2 font-medium leading-tight ${large ? 'text-lg' : 'text-sm'}`}>{sample.hosts}</h3>
                        <p className="mt-2 text-[9px] leading-4 opacity-80">{sample.when}</p>
                        <p className="mt-3 text-[8px] tracking-[0.12em] uppercase" style={{ color: design.palette.gold }}>{mods[0]}</p>
                    </div>
                </div>
            );
        case 'botanical-frame':
            return (
                <div className={`${pad} min-h-[220px]`} style={{ boxShadow: `inset 0 0 0 2px ${design.palette.gold}` }}>
                    <p className="text-center text-[9px] italic opacity-70">{sample.kicker}</p>
                    <h3 className={`mt-3 text-center font-serif ${title} leading-tight`}>{sample.hosts}</h3>
                    <p className="mt-3 text-center text-[10px]">{sample.when}</p>
                    <ul className="mt-4 space-y-1 text-center text-[9px] opacity-80">
                        {mods.slice(0, 3).map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </div>
            );
        case 'ornament-ledger':
            return (
                <div className={`${pad} min-h-[220px]`}>
                    <div className="border px-2 py-3 text-center" style={{ borderColor: design.palette.gold }}>
                        <p className="text-[8px] tracking-[0.2em] uppercase">{sample.kicker}</p>
                        <h3 className={`mt-2 font-serif ${title} leading-tight`}>{sample.hosts}</h3>
                    </div>
                    <p className="mt-3 text-center text-[10px]">{sample.where}</p>
                    <p className="mt-1 text-center text-[9px] opacity-70">{sample.when}</p>
                </div>
            );
        case 'color-block':
            return (
                <div className="min-h-[220px]">
                    <div className="px-3 py-4 text-white" style={{ background: design.palette.accent }}>
                        <h3 className={`font-serif ${title} leading-tight`}>{sample.hosts}</h3>
                    </div>
                    <div className="px-3 py-3">
                        <p className="text-[10px]">{sample.when}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {mods.slice(0, 3).map((item) => (
                                <span key={item} className="rounded-full px-2 py-0.5 text-[8px] text-white" style={{ background: design.palette.gold }}>
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            );
        case 'display-type':
            return (
                <div className={`${pad} flex min-h-[220px] flex-col justify-end`}>
                    <p className="text-[8px] tracking-[0.24em] uppercase opacity-50">{mods[0]}</p>
                    <h3 className="mt-1 font-serif text-3xl leading-[0.9]">{sample.hosts}</h3>
                    <p className="mt-3 text-[10px] opacity-80">{sample.where}</p>
                </div>
            );
        case 'full-bleed':
            return (
                <div className="relative min-h-[220px]" style={{ background: design.palette.accent }}>
                    <div className="absolute inset-x-0 bottom-0 p-3" style={{ background: `${design.palette.paper}ee` }}>
                        <h3 className={`font-serif ${large ? 'text-xl' : 'text-base'} leading-tight`}>{sample.hosts}</h3>
                        <p className="mt-1 text-[9px] opacity-80">{sample.when}</p>
                    </div>
                </div>
            );
        case 'illustrated-mark':
            return (
                <div className={`${pad} min-h-[220px] text-center`}>
                    <span className="mx-auto grid h-10 w-10 place-items-center rounded-full font-serif text-lg" style={{ background: design.palette.gold, color: design.palette.paper }}>
                        {sample.hosts.charAt(0)}
                    </span>
                    <h3 className={`mt-3 font-serif ${title} leading-tight`}>{sample.hosts}</h3>
                    <p className="mt-2 text-[10px] italic opacity-80">{sample.kicker}</p>
                    <p className="mt-3 text-[9px]">{sample.where}</p>
                </div>
            );
        case 'module-hub':
            return (
                <div className={`${pad} min-h-[220px]`}>
                    <h3 className={`font-serif ${large ? 'text-xl' : 'text-base'} leading-tight`}>{sample.hosts}</h3>
                    <p className="mt-1 text-[9px] opacity-70">{sample.when}</p>
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                        {mods.map((item) => (
                            <div key={item} className="rounded-lg px-2 py-2 text-[8px]" style={{ background: `${design.palette.gold}33` }}>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            );
        default:
            return (
                <div className={`${pad} min-h-[220px] text-center`}>
                    <p className="text-[9px] tracking-[0.2em] uppercase opacity-60">{sample.kicker}</p>
                    <h3 className={`mt-3 font-serif ${title} leading-tight`}>{sample.hosts}</h3>
                    <span className="mx-auto mt-3 block h-px w-8" style={{ background: design.palette.gold }} />
                    <p className="mt-3 text-[10px] tabular-nums">05 : 12 : 08</p>
                    <p className="mt-2 text-[9px] opacity-70">{sample.where}</p>
                </div>
            );
    }
}

export function CardPreview({ design, large = false }: { design: GalleryDesign; large?: boolean }) {
    const sample = design.sample;
    const ratio =
        design.format === 'landscape' ? 'aspect-[1.9/1]' : design.format === 'square' ? 'aspect-square' : 'aspect-[3/4]';
    const width = large
        ? design.format === 'landscape'
            ? 'max-w-[420px]'
            : 'max-w-[240px]'
        : design.format === 'landscape'
            ? 'max-w-full'
            : 'max-w-[150px]';

    if (design.event_type === 'wedding' || design.event_type === 'housewarming') {
        return (
            <div className={`mx-auto w-full overflow-hidden rounded-2xl shadow-md ${width}`}>
                <InvitationCardFace design={design} variant={large ? 'full' : 'compact'} />
            </div>
        );
    }

    return (
        <div className={`mx-auto w-full overflow-hidden ${width}`}>
            <div className={`overflow-hidden rounded-2xl shadow-md ${ratio}`} style={tone(design)}>
                <CardLayout design={design} sample={sample} />
            </div>
        </div>
    );
}

function CardLayout({ design, sample }: { design: GalleryDesign; sample: GalleryDesign['sample'] }) {
    switch (design.layout) {
        case 'foil-panel':
            return (
                <div className="flex h-full flex-col justify-between p-4">
                    <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: design.palette.gold }}>{sample.kicker}</p>
                    <div>
                        <h3 className="font-serif text-2xl leading-tight">{sample.hosts}</h3>
                        <p className="mt-2 text-[10px] opacity-80">{sample.when}</p>
                    </div>
                    <span className="h-px w-12" style={{ background: design.palette.gold }} />
                </div>
            );
        case 'edge-type':
            return (
                <div className="flex h-full">
                    <div className="w-2" style={{ background: design.palette.accent }} />
                    <div className="flex flex-1 flex-col justify-center p-4">
                        <h3 className="text-xl leading-none font-medium">{sample.hosts}</h3>
                        <p className="mt-2 text-[10px] opacity-70">{sample.where}</p>
                    </div>
                </div>
            );
        case 'bloom-border':
            return (
                <div className="flex h-full items-center justify-center p-3">
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-[40%] border text-center" style={{ borderColor: design.palette.gold }}>
                        <p className="text-[8px] tracking-[0.18em] uppercase opacity-70">{sample.kicker}</p>
                        <h3 className="mt-2 font-serif text-xl leading-tight">{sample.hosts}</h3>
                    </div>
                </div>
            );
        case 'mandala-seal':
            return (
                <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                    <span className="grid h-12 w-12 place-items-center rounded-full border-2 font-serif" style={{ borderColor: design.palette.gold }}>ॐ</span>
                    <h3 className="mt-3 font-serif text-lg leading-tight">{sample.hosts}</h3>
                    <p className="mt-1 text-[10px] opacity-70">{sample.when}</p>
                </div>
            );
        case 'confetti-tile':
            return (
                <div className="grid h-full grid-rows-[1fr_auto]">
                    <div className="grid grid-cols-4 gap-1 p-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <span key={i} className="rounded-sm" style={{ background: i % 2 ? design.palette.gold : design.palette.accent, opacity: 0.45 }} />
                        ))}
                    </div>
                    <div className="p-3">
                        <h3 className="font-serif text-lg leading-tight">{sample.hosts}</h3>
                    </div>
                </div>
            );
        case 'giant-serif':
            return (
                <div className="flex h-full flex-col justify-end p-4">
                    <h3 className="font-serif text-3xl leading-[0.85]">{sample.hosts}</h3>
                    <p className="mt-2 text-[10px] tracking-[0.16em] uppercase opacity-60">{sample.where}</p>
                </div>
            );
        case 'photo-mat':
            return (
                <div className="flex h-full flex-col p-2">
                    <div className="min-h-0 flex-1 rounded-md" style={{ background: design.palette.accent }} />
                    <p className="px-1 py-2 text-center font-serif text-sm">{sample.hosts}</p>
                </div>
            );
        case 'ink-drawing':
            return (
                <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                    <svg viewBox="0 0 64 40" className="h-10 w-16" aria-hidden>
                        <path d="M4 32c8-18 16-18 24 0 8-18 16-18 24 0" fill="none" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                    <h3 className="mt-2 font-serif text-lg italic">{sample.hosts}</h3>
                    <p className="text-[10px] opacity-70">{sample.kicker}</p>
                </div>
            );
        case 'qr-suite':
            return (
                <div className="grid h-full grid-cols-[1fr_auto] gap-3 p-3">
                    <div className="flex flex-col justify-center">
                        <p className="text-[8px] tracking-[0.18em] uppercase opacity-60">Open the invite</p>
                        <h3 className="mt-1 font-serif text-lg leading-tight">{sample.hosts}</h3>
                    </div>
                    <span className="h-14 w-14 self-center border-2 border-dashed" style={{ borderColor: design.palette.gold }} />
                </div>
            );
        default:
            return (
                <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                    <p className="text-[9px] tracking-[0.2em] uppercase opacity-60">{sample.kicker}</p>
                    <h3 className="mt-3 font-serif text-xl leading-tight">{sample.hosts}</h3>
                    <span className="mt-3 h-px w-10" style={{ background: design.palette.gold }} />
                    <p className="mt-3 text-[10px]">{sample.when}</p>
                    <p className="mt-1 text-[10px] opacity-70">{sample.where}</p>
                </div>
            );
    }
}
