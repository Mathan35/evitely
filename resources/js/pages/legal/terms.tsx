import { LegalPage } from '@/components/legal/legal-page';
import { MarketingSeoHead, type MarketingSeoPayload } from '@/components/marketing/marketing-seo-head';

export default function Terms({
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
            <LegalPage title="Terms of Service" updatedAt={updatedAt} appName={appName}>
                <p>
                    By creating an account or publishing an invitation on {appName}, you agree to these terms.
                </p>
                <h2>The service</h2>
                <p>
                    {appName} provides tools to design invitation cards and event websites, manage guests and RSVPs, and
                    optionally purchase per-site live windows and message credits. Features available on free trial may
                    differ from paid site packs.
                </p>
                <h2>Your content</h2>
                <p>
                    You own the content you upload. You grant us a license to host and display it so guests can open your
                    invitation. You must have rights to photos, music, and personal data you add (including guest
                    contact details).
                </p>
                <h2>Acceptable use</h2>
                <ul>
                    <li>Do not use the service for unlawful, harassing, or fraudulent invitations.</li>
                    <li>Do not attempt to bypass billing, abuse messaging credits, or attack the platform.</li>
                    <li>Respect guest privacy when collecting RSVPs and sharing personal links.</li>
                </ul>
                <h2>Billing</h2>
                <p>
                    Card invitations stay free. Paid site packs and credits are charged through Razorpay or Stripe as
                    configured for your region. Purchases are generally non-transferable. See our{' '}
                    <a href="/refund" className="underline underline-offset-2">
                        Refund Policy
                    </a>{' '}
                    and{' '}
                    <a href="/cancellation" className="underline underline-offset-2">
                        Cancellation Policy
                    </a>{' '}
                    for details.
                </p>
                <h2>Availability</h2>
                <p>
                    We aim for continuous availability but do not guarantee uninterrupted service. Scheduled maintenance
                    and third-party outages may affect publishing, messaging, or payments.
                </p>
                <h2>Limitation of liability</h2>
                <p>
                    To the fullest extent permitted by law, {appName} is provided “as is.” We are not liable for
                    indirect damages arising from missed RSVPs, delivery failures, or third-party gateway downtime.
                </p>
            </LegalPage>
        </>
    );
}
