import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function TrialWelcomeDialog({
    open,
    onOpenChange,
    upgradeUrl,
    eventLabel,
    trialDays = 30,
    guestLimit = 100,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    upgradeUrl?: string | null;
    eventLabel?: string | null;
    trialDays?: number;
    guestLimit?: number;
}) {
    const features = [
        '1 event per account on free trial',
        'Card invitations free forever',
        `Edit names, story, venue, guests & photos`,
        'Hero layout, backgrounds & intro styles included',
        `${trialDays}-day free guest site when you publish`,
        `Up to ${guestLimit} guests · share WhatsApp links free from your phone`,
        'Invidora badge on the public site (removable on paid)',
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden rounded-[1.5rem] border-zinc-200 p-0 sm:max-w-md">
                <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950 px-6 py-6 text-white">
                    <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-emerald-200 uppercase ring-1 ring-white/10">
                        <Sparkles className="size-3" />
                        Free plan
                    </p>
                    <DialogHeader className="mt-4 space-y-2 text-left">
                        <DialogTitle className="font-serif text-2xl tracking-tight text-white">
                            Free cards · {trialDays}-day guest site
                        </DialogTitle>
                        <DialogDescription className="text-[13px] leading-relaxed text-zinc-300">
                            {eventLabel
                                ? `Your ${eventLabel} editor is ready. Publish, share with friends on WhatsApp, then extend only if you need more days.`
                                : 'Your editor is ready. Publish, share with friends on WhatsApp, then extend only if you need more days.'}
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="space-y-4 px-6 py-5">
                    <ul className="space-y-2.5">
                        {features.map((item) => (
                            <li key={item} className="flex items-start gap-2.5 text-[13px] text-zinc-700">
                                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-700">
                                    <Sparkles className="size-3" />
                                </span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="rounded-xl bg-zinc-50 px-3.5 py-2.5 text-[12px] leading-relaxed text-zinc-500 ring-1 ring-zinc-950/5">
                        Tip: create → pick a design → publish → share — most hosts finish in a few minutes.
                    </p>
                    <DialogFooter className="flex-col gap-2 sm:flex-col">
                        <Button
                            type="button"
                            className="h-11 w-full rounded-xl"
                            onClick={() => onOpenChange(false)}
                        >
                            Start customizing
                        </Button>
                        {upgradeUrl ? (
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-10 w-full rounded-xl text-zinc-500"
                                onClick={() => {
                                    window.location.assign(upgradeUrl);
                                }}
                            >
                                View site packs (optional)
                            </Button>
                        ) : null}
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
