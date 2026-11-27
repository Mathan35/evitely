import { LegalPage } from '@/components/legal/legal-page';
import { MarketingSeoHead, type MarketingSeoPayload } from '@/components/marketing/marketing-seo-head';

export default function Cancellation({
    appName,
    updatedAt,
    seo,
}: {
    appName: string;
    updatedAt: string;
    seo?: MarketingSeoPayload;
}) {
    return (
        <>
            {seo ? <MarketingSeoHead seo={seo} /> : null}
            <LegalPage title="Cancellation Policy" updatedAt={updatedAt} appName={appName}>
                <p>
                    This policy covers cancelling purchases, ending a live site window early, and closing your{' '}
                    {appName} account.
                </p>
                <h2>Before payment completes</h2>
                <p>
                    If you close the Razorpay or Stripe checkout window without completing payment, no charge is made
                    and nothing is activated. You can start checkout again anytime.
                </p>
                <h2>After a successful purchase</h2>
                <ul>
                    <li>
                        Site packs and live windows start according to the schedule or go-live option you chose at
                        checkout.
                    </li>
                    <li>
                        Message credits may follow a short activation window as shown at purchase; once activated or
                        used, they are generally non-cancellable except under the{' '}
                        <a href="/refund" className="underline underline-offset-2">
                            Refund Policy
                        </a>
                        .
                    </li>
                    <li>
                        You may unpublish or take a site offline from your studio at any time. That does not
                        automatically refund unused days.
                    </li>
                </ul>
                <h2>Cancelling scheduled go-live</h2>
                <p>
                    If you purchased a pack with a future start date and have not gone live yet, contact{' '}
                    <a href="/support" className="underline underline-offset-2">
                        Support
                    </a>{' '}
                    as soon as possible. We will review whether the purchase can be cancelled or adjusted before the
                    live window begins.
                </p>
                <h2>Account cancellation</h2>
                <p>
                    You may stop using {appName} at any time. To delete your account and associated event data, send a
                    request via Support from your registered email. We will confirm deletion; residual backups may be
                    retained for a limited period as described in our Privacy Policy.
                </p>
                <h2>Subscriptions</h2>
                <p>
                    {appName} primarily sells one-time site packs and credit packs. If a recurring plan is offered and
                    you subscribed, you can cancel future renewals from billing settings or by contacting Support before
                    the next renewal date. Cancellation stops future charges; it does not refund the current paid
                    period unless covered by the Refund Policy.
                </p>
                <h2>Need help?</h2>
                <p>
                    For cancellations tied to a failed delivery or billing error, include your payment reference when
                    you write to Support so we can resolve it quickly.
                </p>
            </LegalPage>
        </>
    );
}
