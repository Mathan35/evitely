import { LegalPage } from '@/components/legal/legal-page';
import { MarketingSeoHead, type MarketingSeoPayload } from '@/components/marketing/marketing-seo-head';

export default function Cookies({
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
            <LegalPage title="Cookie Notice" updatedAt={updatedAt} appName={appName}>
                <p>
                    {appName} uses cookies and similar storage so the product works. This page summarizes what we use
                    and why.
                </p>
                <h2>Essential</h2>
                <ul>
                    <li>Session and CSRF cookies for signed-in hosts.</li>
                    <li>Appearance / sidebar preferences.</li>
                    <li>Cookie-consent choice (so we do not ask again every visit).</li>
                </ul>
                <h2>Invitation analytics</h2>
                <p>
                    Public invitation pages may set a first-party visitor cookie (or similar) so view counts stay
                    approximate without storing a raw IP address as the primary identifier.
                </p>
                <h2>Payments</h2>
                <p>
                    Checkout providers (Razorpay / Stripe) may set their own cookies during payment. Those are governed
                    by their policies.
                </p>
                <h2>Your choices</h2>
                <p>
                    Essential cookies are required to use the studio. You can clear site data in your browser at any
                    time; you may need to sign in again and re-confirm cookie notice preferences.
                </p>
            </LegalPage>
        </>
    );
}
