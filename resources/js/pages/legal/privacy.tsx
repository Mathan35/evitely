import { LegalPage } from '@/components/legal/legal-page';
import { MarketingSeoHead, type MarketingSeoPayload } from '@/components/marketing/marketing-seo-head';

export default function Privacy({
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
            <LegalPage title="Privacy Policy" updatedAt={updatedAt} appName={appName}>
                <p>
                    {appName} helps hosts create digital invitations and event websites. This policy explains what we
                    collect and how we use it.
                </p>
                <h2>Information we collect</h2>
                <ul>
                    <li>Account details you provide (name, email, password).</li>
                    <li>Event content you create (names, dates, venues, photos, guest lists, RSVPs).</li>
                    <li>Technical data needed to run the service (session cookies, approximate analytics hashes).</li>
                    <li>Payment metadata from our processors when you buy a site pack or credits (we do not store full card numbers).</li>
                </ul>
                <h2>How we use information</h2>
                <ul>
                    <li>To operate your studio, publish invitations, and deliver guest features (RSVP, guestbook, photos).</li>
                    <li>To send transactional email or optional automated messages you enable.</li>
                    <li>To improve reliability, prevent abuse, and support billing.</li>
                </ul>
                <h2>Sharing</h2>
                <p>
                    We share data with infrastructure and delivery providers you rely on to use the product (hosting,
                    email, SMS/WhatsApp when configured, and payment gateways). We do not sell guest lists.
                </p>
                <h2>Retention &amp; deletion</h2>
                <p>
                    Host account and event data remain while your account is active. You may delete events or request
                    account deletion from support. Backups may retain residual copies for a limited period.
                </p>
                <h2>Contact</h2>
                <p>
                    Questions about privacy: visit our{' '}
                    <a href="/support" className="underline underline-offset-2">
                        Support
                    </a>{' '}
                    page and send a message — we will get back to you.
                </p>
            </LegalPage>
        </>
    );
}
