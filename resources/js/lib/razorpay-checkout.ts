type RazorpayPrefill = {
    name?: string;
    email?: string;
    contact?: string;
};

export type RazorpayCheckoutOptions = {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    payment_id?: number;
    prefill?: RazorpayPrefill & { method?: string };
    notes?: Record<string, string | number>;
    theme?: { color?: string };
    config?: Record<string, unknown>;
    method?: Record<string, boolean>;
};

type RazorpaySuccessResponse = {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
};

type RazorpayInstance = {
    open: () => void;
    on: (event: string, handler: (response: unknown) => void) => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
    interface Window {
        Razorpay?: RazorpayConstructor;
    }
}

let scriptPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('Checkout requires a browser.'));
    }
    if (window.Razorpay) {
        return Promise.resolve();
    }
    if (scriptPromise) {
        return scriptPromise;
    }

    scriptPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]');
        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('Failed to load checkout.')));
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.dataset.razorpayCheckout = '1';
        script.onload = () => resolve();
        script.onerror = () => {
            scriptPromise = null;
            reject(new Error('Failed to load checkout.'));
        };
        document.body.appendChild(script);
    });

    return scriptPromise;
}

/**
 * Laravel EncryptCookies puts the session CSRF in XSRF-TOKEN (URL-encoded).
 * Always prefer this over <meta name="csrf-token"> — Inertia SPA navigations
 * leave the meta tag stale, which caused "CSRF token mismatch" (419).
 */
function xsrfCookieToken(): string {
    const raw = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='))
        ?.split('=')
        .slice(1)
        .join('=');

    if (!raw) {
        return '';
    }

    try {
        return decodeURIComponent(raw);
    } catch {
        return raw;
    }
}

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const xsrf = xsrfCookieToken();
    if (!xsrf) {
        throw new Error('Missing CSRF cookie. Refresh the page and try again.');
    }

    const response = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            // Only X-XSRF-TOKEN — do NOT send stale meta X-CSRF-TOKEN / _token.
            // Laravel checks those first and rejects before falling back to the cookie.
            'X-XSRF-TOKEN': xsrf,
        },
        body: JSON.stringify(body),
    });

    const data = (await response.json().catch(() => ({}))) as T & {
        message?: string;
        errors?: Record<string, string[]>;
    };

    if (response.status === 419) {
        throw new Error('Session expired. Refresh the page and try payment again.');
    }

    if (!response.ok) {
        const fieldError = data.errors
            ? Object.values(data.errors).flat().find(Boolean)
            : undefined;
        throw new Error(fieldError || data.message || 'Payment request failed.');
    }

    return data;
}

function friendlyPaymentError(detail: string): string {
    const lower = detail.toLowerCase();
    if (lower.includes('international')) {
        return 'International cards aren’t available for this checkout. Pay with UPI, an Indian debit/credit card, or netbanking.';
    }
    if (lower.includes('razorpay') || lower.includes('stripe')) {
        return 'Checkout isn’t available right now. Please try again later.';
    }
    return detail;
}

export async function startRazorpayCheckout(input: {
    orderUrl: string;
    orderBody: Record<string, unknown>;
    verifyUrl?: string;
    onPaid?: () => void;
    preloadedCheckout?: RazorpayCheckoutOptions;
}): Promise<void> {
    await loadRazorpayScript();

    if (!window.Razorpay) {
        throw new Error('Razorpay Checkout is unavailable.');
    }

    const checkout =
        input.preloadedCheckout ??
        (
            await postJson<{ checkout: RazorpayCheckoutOptions }>(input.orderUrl, input.orderBody)
        ).checkout;

    await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
            key: checkout.key,
            amount: checkout.amount,
            currency: checkout.currency,
            name: checkout.name,
            description: checkout.description,
            order_id: checkout.order_id,
            prefill: {
                method: 'upi',
                ...(checkout.prefill ?? {}),
            },
            notes: checkout.notes ?? {},
            theme: checkout.theme ?? { color: '#18181b' },
            ...(checkout.config ? { config: checkout.config } : {}),
            ...(checkout.method ? { method: checkout.method } : {}),
            handler: async (response: RazorpaySuccessResponse) => {
                try {
                    await postJson(input.verifyUrl || '/settings/billing/razorpay/verify', {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                    });
                    input.onPaid?.();
                    resolve();
                } catch (error) {
                    reject(error instanceof Error ? error : new Error('Verification failed.'));
                }
            },
            modal: {
                ondismiss: () => reject(new Error('Payment cancelled.')),
            },
        });

        rzp.on('payment.failed', (response: unknown) => {
            const detail =
                typeof response === 'object' &&
                response &&
                'error' in response &&
                typeof (response as { error?: { description?: string } }).error?.description ===
                    'string'
                    ? (response as { error: { description: string } }).error.description
                    : 'Payment failed.';
            reject(new Error(friendlyPaymentError(detail)));
        });

        rzp.open();
    });
}
