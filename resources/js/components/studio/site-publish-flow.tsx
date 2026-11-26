import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export type SitePublishBilling = {
    trial_available?: boolean;
    trial_used_on?: { id: number; title: string; status: string } | null;
    has_paid_pack?: boolean;
    legacy_account_pro?: boolean;
    can_schedule_publish?: boolean;
    is_view_only?: boolean;
    is_card_only?: boolean;
    is_site?: boolean;
    upgrade_url?: string;
};

export function useSitePublishFlow({
    weddingId,
    invitationMode,
    siteBilling,
    trialDays = 30,
    publishing = false,
    onPublish,
}: {
    weddingId: number;
    invitationMode?: string | null;
    siteBilling?: SitePublishBilling | null;
    trialDays?: number;
    publishing?: boolean;
    onPublish: (paid: boolean) => void;
}): {
    beginSitePublish: () => boolean;
    sitePublishDialogs: ReactNode;
} {
    const [trialConfirmOpen, setTrialConfirmOpen] = useState(false);
    const [publishChooserOpen, setPublishChooserOpen] = useState(false);

    const trialAvailable = siteBilling?.trial_available !== false;
    const trialUsedOn = siteBilling?.trial_used_on ?? null;
    const billingUrl = siteBilling?.upgrade_url || `/events/${weddingId}/billing`;
    const isSiteInvitation =
        invitationMode !== 'card'
        && siteBilling?.is_site !== false
        && siteBilling?.is_card_only !== true;

    function beginSitePublish(): boolean {
        if (siteBilling?.is_view_only) {
            window.location.assign(billingUrl);
            return true;
        }
        if (!isSiteInvitation) {
            return false;
        }
        if (trialAvailable) {
            setTrialConfirmOpen(true);
            return true;
        }
        setPublishChooserOpen(true);
        return true;
    }

    function proceedTrialPublish(): void {
        setTrialConfirmOpen(false);
        onPublish(false);
    }

    function openPaidPublishOptions(): void {
        setTrialConfirmOpen(false);
        setPublishChooserOpen(true);
    }

    function confirmPublishPaid(): void {
        setPublishChooserOpen(false);
        if (siteBilling?.has_paid_pack || siteBilling?.legacy_account_pro) {
            onPublish(true);
            return;
        }
        window.location.assign(`${billingUrl}?intent=publish`);
    }

    function confirmSchedulePublish(): void {
        setPublishChooserOpen(false);
        window.location.assign(`${billingUrl}?intent=schedule`);
    }

    const sitePublishDialogs = (
        <>
            <ConfirmDialog
                open={trialConfirmOpen}
                onOpenChange={setTrialConfirmOpen}
                title="Use your one free trial publish?"
                description={
                    <>
                        Free accounts can publish only one guest site with the {trialDays}-day trial. Other events will
                        need a paid pack. Are you sure you want to publish this invitation with your free try?
                        <button
                            type="button"
                            className="mt-3 block text-left text-[13px] font-medium text-zinc-700 underline-offset-2 hover:underline"
                            onClick={openPaidPublishOptions}
                        >
                            Prefer a paid pack instead…
                        </button>
                    </>
                }
                confirmLabel="Yes, publish with free try"
                cancelLabel="Not now"
                tone="default"
                loading={publishing}
                onConfirm={proceedTrialPublish}
            />

            <Dialog open={publishChooserOpen} onOpenChange={setPublishChooserOpen}>
                <DialogContent className="gap-5 rounded-[1.35rem] border-zinc-200/80 p-6 shadow-2xl shadow-zinc-950/15 sm:max-w-md">
                    <DialogHeader className="gap-2 text-left">
                        <DialogTitle className="text-[17px] font-semibold tracking-tight text-zinc-900">
                            Go live
                        </DialogTitle>
                        <DialogDescription className="text-[13px] leading-relaxed text-zinc-500">
                            {trialAvailable
                                ? `Choose how to publish. One free ${trialDays}-day try per account.`
                                : trialUsedOn
                                  ? `Your free ${trialDays}-day try is already used on “${trialUsedOn.title}”. Buy a site pack to publish this invitation.`
                                  : `Your free ${trialDays}-day try was already used. Buy a site pack to publish this invitation.`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                        <Button
                            type="button"
                            className="h-11 rounded-full"
                            disabled={publishing}
                            onClick={confirmPublishPaid}
                        >
                            {siteBilling?.has_paid_pack || siteBilling?.legacy_account_pro
                                ? 'Publish with paid plan'
                                : 'Publish with paid pack…'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-full"
                            disabled={publishing}
                            onClick={confirmSchedulePublish}
                        >
                            {siteBilling?.has_paid_pack || siteBilling?.legacy_account_pro || siteBilling?.can_schedule_publish
                                ? 'Schedule publish…'
                                : 'Schedule publish (pay first)…'}
                        </Button>
                        {!trialAvailable && trialUsedOn ? (
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-10 rounded-full text-zinc-600"
                                onClick={() => {
                                    setPublishChooserOpen(false);
                                    window.location.assign(`/events/${trialUsedOn.id}`);
                                }}
                            >
                                Open “{trialUsedOn.title}”
                            </Button>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );

    return { beginSitePublish, sitePublishDialogs };
}
