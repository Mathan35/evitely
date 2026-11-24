import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function TrialEventLimitDialog({
    open,
    onOpenChange,
    upgradeUrl,
    eventLimit = 1,
    existingEventHref = '/events',
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    upgradeUrl?: string | null;
    eventLimit?: number;
    existingEventHref?: string;
}) {
    const one = eventLimit === 1;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden rounded-[1.5rem] border-zinc-200 p-0 sm:max-w-md">
                <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950 px-6 py-6 text-white">
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-emerald-200 uppercase">
                        Free trial
                    </p>
                    <DialogHeader className="mt-3 space-y-2 text-left">
                        <DialogTitle className="font-serif text-2xl tracking-tight text-white">
                            {one ? 'Your free event is already underway' : `You’ve reached your free-trial limit`}
                        </DialogTitle>
                        <DialogDescription className="text-[13px] leading-relaxed text-zinc-300">
                            {one
                                ? 'The free trial includes one invitation per account so you can finish crafting it with care. Keep editing the one you have, or upgrade when you’re ready for another celebration.'
                                : `The free trial includes ${eventLimit} invitations per account. Keep editing what you’ve started, or upgrade to create more.`}
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="space-y-2 px-6 py-5">
                    <DialogFooter className="flex-col gap-2 sm:flex-col">
                        <Button
                            type="button"
                            className="h-11 w-full rounded-xl"
                            onClick={() => {
                                window.location.assign(existingEventHref);
                            }}
                        >
                            Continue my invitation
                        </Button>
                        {upgradeUrl ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 w-full rounded-xl"
                                onClick={() => {
                                    window.location.assign(upgradeUrl);
                                }}
                            >
                                See upgrade options
                            </Button>
                        ) : null}
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-10 w-full rounded-xl"
                            onClick={() => onOpenChange(false)}
                        >
                            Not now
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
