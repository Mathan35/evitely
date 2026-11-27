import { LegalPage } from '@/components/legal/legal-page';
import { MarketingSeoHead, type MarketingSeoPayload } from '@/components/marketing/marketing-seo-head';

export default function Refund({
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
            <LegalPage title="Refund Policy" updatedAt={updatedAt} appName={appName}>
                <p>
                    This refund policy explains when payments for {appName} site packs, live windows, and message credits
                    may be refunded. Payments are processed by Razorpay (and Stripe where enabled).
                </p>
                <h2>What you are buying</h2>
                <ul>
                    <li>Digital site packs / live windows for invitation websites.</li>
                    <li>Optional message credits for automated guest messaging.</li>
                    <li>Related digital services delivered online (no physical goods).</li>
                </ul>
                <h2>Eligible refunds</h2>
                <p>We may issue a full or partial refund when:</p>
                <ul>
                    <li>You were charged twice for the same order because of a technical error.</li>
                    <li>Payment succeeded but the purchased pack or credits were not applied to your account within a reasonable time after we confirmed the issue.</li>
                    <li>A purchase was made in clear error and you contact us promptly before meaningful use of the paid features.</li>
                </ul>
                <h2>Non-refundable situations</h2>
                <ul>
                    <li>Change of mind after a successful payment when the pack or credits have already been activated or used.</li>
                    <li>Unused remaining days or credits after you published or messaged guests under that purchase.</li>
                    <li>Issues caused by incorrect event details, guest data, or third-party delivery failures (carrier, email provider) outside our control.</li>
                    <li>Chargebacks initiated without first contacting support — these may lead to account review.</li>
                </ul>
                <h2>How to request a refund</h2>
                <p>
                    Contact us through the{' '}
                    <a href="/support" className="underline underline-offset-2">
                        Support
                    </a>{' '}
                    page within <strong>7 days</strong> of the payment date. Include your account email, payment date,
                    amount, and Razorpay/Stripe payment reference if you have it.
                </p>
                <h2>Processing time</h2>
                <p>
                    Approved refunds are initiated to the original payment method. Banks and UPI providers typically
                    show the credit within <strong>5–10 business days</strong>; exact timing depends on your bank or
                    wallet.
                </p>
                <h2>Cancellations</h2>
                <p>
                    For stopping renewals, unused packs, or account closure, see our{' '}
                    <a href="/cancellation" className="underline underline-offset-2">
                        Cancellation Policy
                    </a>
                    .
                </p>
            </LegalPage>
        </>
    );
}
