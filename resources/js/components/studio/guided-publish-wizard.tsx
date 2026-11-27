import { Check, Circle, Sparkles } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    publishBlocking,
    publishChecks,
    type PublishSnapshot,
} from '@/lib/publish-readiness';
import { cn } from '@/lib/utils';

type Step = 'ready' | 'confirm';

/**
 * Multi-step publish readiness before the existing trial/paid chooser runs.
 */
export function useGuidedPublishWizard({
    snapshot,
    onReadyToPublish,
}: {
    snapshot: PublishSnapshot;
    onReadyToPublish: () => void;
}): {
    openPublishWizard: () => void;
    publishWizardDialog: ReactNode;
} {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>('ready');
    const checks = useMemo(() => publishChecks(snapshot), [snapshot]);
    const blocking = useMemo(() => publishBlocking(checks), [checks]);
    const ready = blocking.length === 0;

    function openPublishWizard(): void {
        setStep('ready');
        setOpen(true);
    }

    function continueToConfirm(): void {
        if (!ready) {
            return;
        }
        setOpen(false);
        onReadyToPublish();
    }

    const publishWizardDialog = (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="gap-5 rounded-[1.35rem] border-zinc-200/80 p-6 shadow-2xl shadow-zinc-950/15 sm:max-w-md">
                <DialogHeader className="gap-2 text-left">
                    <DialogTitle className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-zinc-900">
                        <Sparkles className="size-4 text-emerald-600" />
                        Ready to go live?
                    </DialogTitle>
                    <DialogDescription className="text-[13px] leading-relaxed text-zinc-500">
                        A quick polish check — guests judge the first open. Fix anything missing, then
                        publish.
                    </DialogDescription>
                </DialogHeader>

                <ul className="space-y-2">
                    {checks.map((check) => (
                        <li
                            key={check.id}
                            className={cn(
                                'flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-[13px]',
                                check.ok ? 'bg-emerald-50/80 text-emerald-950' : 'bg-amber-50/90 text-amber-950',
                            )}
                        >
                            {check.ok ? (
                                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                            ) : (
                                <Circle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                            )}
                            <span>
                                <span className="font-medium">{check.label}</span>
                                {!check.ok && check.required ? (
                                    <span className="mt-0.5 block text-[11px] text-amber-800/80">
                                        Required before publish
                                    </span>
                                ) : null}
                            </span>
                        </li>
                    ))}
                </ul>

                <div className="flex flex-col gap-2">
                    <Button
                        type="button"
                        className="h-11 rounded-full"
                        disabled={!ready}
                        onClick={continueToConfirm}
                    >
                        {ready ? 'Continue to publish…' : 'Complete required items first'}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-10 rounded-full text-zinc-600"
                        onClick={() => setOpen(false)}
                    >
                        Keep editing
                    </Button>
                </div>
                {step === 'confirm' ? null : null}
            </DialogContent>
        </Dialog>
    );

    return { openPublishWizard, publishWizardDialog };
}
