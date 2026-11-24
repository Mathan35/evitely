import { Bone } from '@/components/skeletons/_primitives';

/**
 * Invitation website content inside an editor/preview device frame.
 * Mirrors framed gallery site: warm paper, gold accents, hero + countdown.
 */
export function FramedSiteContentSkeleton() {
    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f0e3] text-[#2b241c]">
            <div className="flex shrink-0 items-center justify-between border-b border-[#c6a36a]/15 bg-[#f8f0e3]/90 px-4 py-3 sm:px-8 sm:py-3.5">
                <Bone className="h-4 w-10 bg-[#c6a36a]/35" />
                <div className="hidden items-center gap-3 sm:flex md:gap-4">
                    {Array.from({ length: 5 }, (_, i) => (
                        <Bone key={i} className="h-2.5 w-12 bg-[#2b241c]/12" />
                    ))}
                </div>
                <Bone className="size-6 rounded-md bg-[#c6a36a]/30 sm:hidden" />
            </div>

            <div className="relative shrink-0 overflow-hidden bg-zinc-900">
                <Bone className="aspect-[9/14] w-full rounded-none bg-zinc-800/80 sm:aspect-[16/9]" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/65" />
                <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-3 px-6 text-center sm:gap-4">
                    <Bone className="h-2.5 w-24 bg-white/35" />
                    <Bone className="h-10 w-40 max-w-[70%] bg-white/40 sm:h-14 sm:w-56" />
                    <Bone className="h-4 w-6 bg-white/30" />
                    <Bone className="h-10 w-44 max-w-[70%] bg-white/40 sm:h-14 sm:w-56" />
                    <Bone className="mt-1 h-3 w-56 max-w-full bg-white/25 sm:w-72" />
                    <Bone className="h-2.5 w-36 bg-white/30" />
                    <div className="mt-3 flex w-full max-w-xs flex-col gap-2 sm:mt-4 sm:max-w-md sm:flex-row sm:gap-3">
                        <Bone className="h-11 flex-1 rounded-full bg-[#c6a36a]/70" />
                        <Bone className="h-11 flex-1 rounded-full bg-white/25" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-3 px-5 py-8 sm:px-10 sm:py-10">
                <Bone className="h-2.5 w-28 bg-[#c6a36a]/40" />
                <Bone className="h-7 w-40 bg-[#2b241c]/15" />
                <div className="mt-2 grid w-full max-w-xl grid-cols-4 gap-2 sm:gap-4">
                    {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <Bone className="h-8 w-10 bg-[#c6a36a]/35 sm:h-9 sm:w-12" />
                            <Bone className="h-2 w-10 bg-[#2b241c]/10" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
