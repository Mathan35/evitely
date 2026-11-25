import { Form, Link, router, usePage } from '@inertiajs/react';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { BrandMark } from '@/components/brand-mark';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { SocialLoginButtons } from '@/components/social-login-buttons';
import { request } from '@/routes/password';
import { store as loginStore } from '@/routes/login';
import { store as registerStore } from '@/routes/register';

const INTENT_KEY = 'invidora:auth-intent';

export type AuthIntent =
    | { type: 'favorite'; id: string }
    | { type: 'customize'; href: string }
    | { type: 'start' };

type AuthGateValue = {
    open: (intent?: AuthIntent, tab?: 'login' | 'register') => void;
    ensure: (intent: AuthIntent) => boolean;
};

const AuthGateContext = createContext<AuthGateValue | null>(null);

function readIntent(): AuthIntent | null {
    try {
        const raw = window.sessionStorage.getItem(INTENT_KEY);

        return raw ? (JSON.parse(raw) as AuthIntent) : null;
    } catch {
        return null;
    }
}

function writeIntent(intent: AuthIntent | null): void {
    if (!intent) {
        window.sessionStorage.removeItem(INTENT_KEY);

        return;
    }

    window.sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent));
}

export function AuthGateProvider({ children }: { children: ReactNode }) {
    const pageProps = usePage().props as { auth?: { user?: unknown } | null };
    const auth = pageProps.auth ?? { user: null };
    const [visible, setVisible] = useState(false);
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const wasGuest = useRef(!auth.user);

    const resume = useCallback((intent: AuthIntent | null) => {
        writeIntent(null);

        if (!intent) {
            return;
        }

        if (intent.type === 'favorite') {
            router.post(
                '/favorites',
                { design_id: intent.id },
                {
                    preserveScroll: true,
                    preserveState: true,
                    showProgress: false,
                    only: ['galleryFavoriteIds'],
                },
            );

            return;
        }

        if (intent.type === 'customize') {
            router.visit(intent.href);

            return;
        }

        router.visit('/events?create=1');
    }, []);

    const open = useCallback((intent?: AuthIntent, nextTab: 'login' | 'register' = 'login') => {
        if (intent) {
            writeIntent(intent);
        }

        setTab(nextTab);
        setVisible(true);
    }, []);

    const ensure = useCallback(
        (intent: AuthIntent) => {
            if (auth.user) {
                return true;
            }

            open(intent, 'login');

            return false;
        },
        [auth.user, open],
    );

    useEffect(() => {
        if (!auth.user) {
            wasGuest.current = true;

            return;
        }

        setVisible(false);

        if (wasGuest.current) {
            wasGuest.current = false;
            resume(readIntent());
        }
    }, [auth.user, resume]);

    return (
        <AuthGateContext.Provider value={{ open, ensure }}>
            {children}
            <AuthDialog open={visible} tab={tab} onTab={setTab} onOpenChange={setVisible} />
        </AuthGateContext.Provider>
    );
}

export function useAuthGate(): AuthGateValue {
    const value = useContext(AuthGateContext);

    if (!value) {
        throw new Error('useAuthGate must be used within AuthGateProvider');
    }

    return value;
}

const fieldClass =
    'h-12 rounded-full border-[#eadfd0] bg-white px-4 shadow-none focus-visible:border-[#6aa3e8] focus-visible:ring-2 focus-visible:ring-[#6aa3e8]/25';

function AuthDialog({
    open,
    tab,
    onTab,
    onOpenChange,
}: {
    open: boolean;
    tab: 'login' | 'register';
    onTab: (tab: 'login' | 'register') => void;
    onOpenChange: (open: boolean) => void;
}) {
    const { canResetPassword, canRegister } = usePage().props;
    const isLogin = tab === 'login';
    const [direction, setDirection] = useState<1 | -1>(1);

    function switchTab(next: 'login' | 'register'): void {
        if (next === tab) {
            return;
        }

        setDirection(next === 'register' ? 1 : -1);
        onTab(next);
    }

    const paneClass = direction === 1 ? 'auth-pane-in-right' : 'auth-pane-in-left';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                // Above event preview dialog (overlay z-70 / content z-80) so login isn't trapped behind it.
                overlayClassName="z-[90] bg-[#1c1814]/55 backdrop-blur-[8px]"
                className="z-[100] flex h-[min(90vh,780px)] max-h-[90vh] flex-col overflow-hidden border-0 bg-white p-0 shadow-[0_40px_80px_-24px_rgba(28,24,20,0.55)] sm:max-w-[860px] rounded-[1.75rem] gap-0 [&>button]:top-5 [&>button]:right-5 [&>button]:z-20 [&>button]:rounded-full [&>button]:bg-white [&>button]:p-1.5 [&>button]:opacity-100 [&>button]:shadow-sm [&>button]:ring-1 [&>button]:ring-black/5"
            >
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain md:grid md:h-full md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] md:overflow-hidden">
                    <aside className="relative h-44 shrink-0 overflow-hidden md:h-full md:min-h-0">
                        <img
                            key={tab}
                            src={isLogin ? '/images/auth/login-hero.jpg' : '/images/auth/register-hero.jpg'}
                            alt=""
                            className="auth-hero-in absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#c47a4a]/70 via-[#d8a06a]/20 to-transparent px-6 pb-7 pt-16">
                            <p key={`${tab}-caption`} className={`${paneClass} text-center text-sm font-medium text-white drop-shadow-sm`}>
                                {isLogin ? 'Create, invite, and celebrate with Invidora ✨' : 'Design beautiful invites in minutes ✨'}
                            </p>
                        </div>
                    </aside>

                    <div className="min-h-0 bg-white px-6 pt-7 pb-8 sm:px-9 sm:pt-8 sm:pb-10 md:overflow-y-auto md:overscroll-contain">
                        <DialogHeader className="gap-1 text-left">
                            <BrandMark href="/" className="pointer-events-none text-[1.65rem]" iconClassName="h-8 w-8" />
                        </DialogHeader>

                        <div className="mt-5 grid grid-cols-2 rounded-full bg-[#f3eee6] p-1">
                            <button
                                type="button"
                                className={`rounded-full py-2 text-sm transition ${isLogin ? 'bg-white text-[#1c1814] shadow-sm' : 'text-[#9a9188]'}`}
                                onClick={() => switchTab('login')}
                            >
                                Sign in
                            </button>
                            <button
                                type="button"
                                className={`rounded-full py-2 text-sm transition ${!isLogin ? 'bg-white text-[#1c1814] shadow-sm' : 'text-[#9a9188]'}`}
                                disabled={!canRegister}
                                onClick={() => switchTab('register')}
                            >
                                Create account
                            </button>
                        </div>

                        <div key={tab} className={paneClass}>
                        <DialogHeader className="mt-5 gap-1 text-left">
                            <DialogTitle className="font-serif text-[2rem] leading-tight font-normal text-[#1c1814]">
                                {isLogin ? 'Welcome back' : 'Create your account'}
                            </DialogTitle>
                            <DialogDescription className="mt-1 text-[13.5px] leading-5 text-[#7a7168]">
                                {isLogin
                                    ? 'Sign in to save favorites and customize this design.'
                                    : 'Create a studio account to save favorites and customize this design.'}
                            </DialogDescription>
                        </DialogHeader>

                        {isLogin ? (
                            <Form {...loginStore.form()} resetOnSuccess={['password']} className="mt-5 flex flex-col gap-3.5">
                                {({ processing, errors }) => (
                                    <>
                                        <input type="hidden" name="modal" value="1" />
                                        <Field id="modal-email" label="Email address" error={errors.email}>
                                            <Input id="modal-email" type="email" name="email" required autoComplete="email" autoFocus placeholder="you@studio.com" className={fieldClass} />
                                        </Field>
                                        <Field
                                            id="modal-password"
                                            label="Password"
                                            error={errors.password}
                                            extra={
                                                canResetPassword ? (
                                                    <Link href={request()} className="text-[13px] text-[#c6a36a] hover:underline">
                                                        Forgot password?
                                                    </Link>
                                                ) : null
                                            }
                                        >
                                            <PasswordInput id="modal-password" name="password" required autoComplete="current-password" placeholder="••••••••••" className={fieldClass} />
                                        </Field>
                                        <div className="flex items-center gap-2 pt-0.5">
                                            <Checkbox id="modal-remember" name="remember" />
                                            <Label htmlFor="modal-remember" className="text-[13px] font-normal text-[#5e554c]">
                                                Remember me
                                            </Label>
                                        </div>
                                        <Button type="submit" disabled={processing} className="mt-1 h-12 rounded-full bg-[#c6a36a] text-[15px] font-medium text-white shadow-none hover:bg-[#b8945b]">
                                            {processing && <Spinner />}
                                            Continue
                                        </Button>
                                        <SocialLoginButtons compact />
                                    </>
                                )}
                            </Form>
                        ) : (
                            <Form {...registerStore.form()} resetOnSuccess={['password', 'password_confirmation']} className="mt-5 flex flex-col gap-3.5">
                                {({ processing, errors }) => (
                                    <>
                                        <input type="hidden" name="modal" value="1" />
                                        <Field id="modal-name" label="Name" error={errors.name}>
                                            <Input id="modal-name" type="text" name="name" required autoComplete="name" autoFocus placeholder="Your name" className={fieldClass} />
                                        </Field>
                                        <Field id="modal-register-email" label="Email address" error={errors.email}>
                                            <Input id="modal-register-email" type="email" name="email" required autoComplete="email" placeholder="you@studio.com" className={fieldClass} />
                                        </Field>
                                        <Field id="modal-register-password" label="Password" error={errors.password}>
                                            <PasswordInput id="modal-register-password" name="password" required autoComplete="new-password" placeholder="Password" className={fieldClass} />
                                        </Field>
                                        <Field id="modal-password-confirmation" label="Confirm password" error={errors.password_confirmation}>
                                            <PasswordInput id="modal-password-confirmation" name="password_confirmation" required autoComplete="new-password" placeholder="Confirm password" className={fieldClass} />
                                        </Field>
                                        <Button type="submit" disabled={processing} className="mt-1 h-12 rounded-full bg-[#c6a36a] text-[15px] font-medium text-white shadow-none hover:bg-[#b8945b]">
                                            {processing && <Spinner />}
                                            Continue
                                        </Button>
                                        <SocialLoginButtons compact />
                                    </>
                                )}
                            </Form>
                        )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    id,
    label,
    error,
    extra,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    extra?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <div className="flex items-center justify-between">
                <Label htmlFor={id}>{label}</Label>
                {extra}
            </div>
            {children}
            <InputError message={error} />
        </div>
    );
}
