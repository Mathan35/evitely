import { useForm } from '@inertiajs/react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useEffect, useId, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { resolveIntroStyleId, type IntroStyleId } from '@/lib/invitation-intro-styles';
import { cn } from '@/lib/utils';

export type InvitationPasscodeGateProps = {
    unlockUrl: string;
    returnTo: string;
    hosts: string[];
    initials: string;
    title: string;
    introStyle?: string | null;
    theme: {
        paper: string;
        ink: string;
        seal: string;
        accent: string;
    };
};

const DARK_INTRO_STYLES: IntroStyleId[] = ['noir', 'velvet', 'vault', 'celeste'];

function GateCartoons() {
    return (
        <div className="invite-passcode-gate__cartoons" aria-hidden>
            {/* Envelope */}
            <svg className="invite-passcode-gate__cartoon invite-passcode-gate__cartoon--envelope" viewBox="0 0 64 52" fill="none">
                <rect x="4" y="10" width="56" height="38" rx="6" fill="#FFF7F0" stroke="#E8C9B5" strokeWidth="1.5" />
                <path d="M6 14l26 18L58 14" stroke="#E8C9B5" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="46" cy="34" r="7" fill="#F2B8A8" />
                <path d="M46 30.5v7M42.5 34h7" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
            </svg>

            {/* Linked rings */}
            <svg className="invite-passcode-gate__cartoon invite-passcode-gate__cartoon--rings" viewBox="0 0 56 40" fill="none">
                <circle cx="20" cy="20" r="12" stroke="#D4B06A" strokeWidth="3" />
                <circle cx="36" cy="20" r="12" stroke="#C9A0B0" strokeWidth="3" />
                <circle cx="20" cy="20" r="7.5" stroke="#E8D5A8" strokeWidth="1.2" opacity="0.7" />
            </svg>

            {/* Tiny cake */}
            <svg className="invite-passcode-gate__cartoon invite-passcode-gate__cartoon--cake" viewBox="0 0 48 52" fill="none">
                <path d="M24 4v8" stroke="#D4B06A" strokeWidth="2" strokeLinecap="round" />
                <circle cx="24" cy="3.5" r="2.5" fill="#F2B8A8" />
                <rect x="8" y="14" width="32" height="12" rx="4" fill="#FFF1E6" stroke="#E8C9B5" strokeWidth="1.4" />
                <path d="M10 26c3 4 7 4 10 0s7-4 10 0 7 4 10 0" stroke="#F2B8A8" strokeWidth="1.6" fill="none" />
                <rect x="6" y="28" width="36" height="16" rx="5" fill="#FFE8D6" stroke="#E8C9B5" strokeWidth="1.4" />
                <ellipse cx="24" cy="44" rx="20" ry="3.5" fill="#F0DFD0" />
            </svg>

            {/* Dove */}
            <svg className="invite-passcode-gate__cartoon invite-passcode-gate__cartoon--dove" viewBox="0 0 60 44" fill="none">
                <path
                    d="M10 28c6-10 16-16 28-14 4 8 2 16-4 20-8 2-16 0-24-6z"
                    fill="#F7F2EC"
                    stroke="#D8C8B8"
                    strokeWidth="1.4"
                />
                <path d="M34 16c8-8 16-6 20 2-8 2-14 6-18 10" fill="#EFE6DC" stroke="#D8C8B8" strokeWidth="1.3" />
                <circle cx="18" cy="24" r="1.4" fill="#8B7355" />
                <path d="M12 26l-5 1.5" stroke="#E8A878" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M28 30c4 4 10 6 16 4" stroke="#C9A0B0" strokeWidth="1.3" strokeLinecap="round" />
            </svg>

            {/* Champagne flute */}
            <svg className="invite-passcode-gate__cartoon invite-passcode-gate__cartoon--flute" viewBox="0 0 36 56" fill="none">
                <path d="M10 4h16l-3 28H13L10 4z" fill="#F5FBFF" stroke="#B7CBD8" strokeWidth="1.4" />
                <path d="M12 8h12l-1.2 10H13.2L12 8z" fill="#FFE8B8" opacity="0.85" />
                <path d="M18 32v16" stroke="#B7CBD8" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M10 50h16" stroke="#B7CBD8" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="14" cy="12" r="1.1" fill="#fff" />
                <circle cx="20" cy="15" r="0.9" fill="#fff" />
            </svg>

            {/* Rose bloom */}
            <svg className="invite-passcode-gate__cartoon invite-passcode-gate__cartoon--rose" viewBox="0 0 44 48" fill="none">
                <path d="M22 28c-8 2-12 10-10 16 6-2 12-2 18 0 2-6-2-14-8-16z" fill="#C9D9C3" />
                <circle cx="22" cy="18" r="12" fill="#F2B8A8" />
                <circle cx="18" cy="16" r="5" fill="#E89A8A" opacity="0.85" />
                <circle cx="26" cy="20" r="4.5" fill="#FFD2C4" />
                <circle cx="22" cy="14" r="3.2" fill="#FFE0D4" />
                <path d="M22 28v10" stroke="#8FA88A" strokeWidth="1.6" strokeLinecap="round" />
            </svg>

            {/* Gift box */}
            <svg className="invite-passcode-gate__cartoon invite-passcode-gate__cartoon--gift" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="18" width="32" height="24" rx="4" fill="#FFE8D6" stroke="#E8C9B5" strokeWidth="1.4" />
                <rect x="6" y="12" width="36" height="10" rx="3" fill="#FFF1E6" stroke="#E8C9B5" strokeWidth="1.4" />
                <path d="M24 12v30" stroke="#F2B8A8" strokeWidth="2.2" />
                <path d="M8 22h32" stroke="#F2B8A8" strokeWidth="2" />
                <path d="M24 12c-4-6-10-4-10 0 0 4 6 6 10 8 4-2 10-4 10-8 0-4-6-6-10 0z" fill="#C9A0B0" />
            </svg>

            {/* Balloon */}
            <svg className="invite-passcode-gate__cartoon invite-passcode-gate__cartoon--balloon" viewBox="0 0 36 56" fill="none">
                <ellipse cx="18" cy="18" rx="14" ry="16" fill="#F6C6D4" stroke="#E4A8BA" strokeWidth="1.3" />
                <ellipse cx="13" cy="12" rx="4" ry="5" fill="#fff" opacity="0.45" />
                <path d="M18 34l-2 3 2 2 2-2-2-3z" fill="#E4A8BA" />
                <path d="M18 39c0 8 3 12 0 15" stroke="#C9B8B0" strokeWidth="1.3" strokeLinecap="round" />
            </svg>

            {/* Heart */}
            <svg className="invite-passcode-gate__cartoon invite-passcode-gate__cartoon--heart" viewBox="0 0 36 32" fill="none">
                <path
                    d="M18 28S4 18 4 11c0-4 3.2-7 7.2-7 2.5 0 4.7 1.3 6.8 3.4C20.1 5.3 22.3 4 24.8 4 28.8 4 32 7 32 11c0 7-14 17-14 17z"
                    fill="#F2B8A8"
                    stroke="#E89A8A"
                    strokeWidth="1.2"
                />
                <path d="M11 11c1.2-1.5 3-2 4.4-1.4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
            </svg>

            {/* Camera */}
            <svg className="invite-passcode-gate__cartoon invite-passcode-gate__cartoon--camera" viewBox="0 0 52 40" fill="none">
                <rect x="4" y="10" width="44" height="26" rx="6" fill="#F4EEE8" stroke="#D8C8B8" strokeWidth="1.4" />
                <path d="M16 10l3-5h14l3 5" fill="#EFE6DC" stroke="#D8C8B8" strokeWidth="1.3" strokeLinejoin="round" />
                <circle cx="26" cy="23" r="8" fill="#E8D5A8" stroke="#D4B06A" strokeWidth="1.4" />
                <circle cx="26" cy="23" r="4" fill="#F7F2EC" />
                <circle cx="40" cy="16" r="1.6" fill="#F2B8A8" />
            </svg>

            {/* Music note */}
            <svg className="invite-passcode-gate__cartoon invite-passcode-gate__cartoon--note" viewBox="0 0 32 44" fill="none">
                <path d="M12 30V8l14-4v22" stroke="#C9A0B0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <ellipse cx="9" cy="32" rx="6" ry="5" fill="#C9A0B0" />
                <ellipse cx="23" cy="28" rx="6" ry="5" fill="#D4B06A" />
            </svg>

            {/* Soft sparkles */}
            <svg className="invite-passcode-gate__cartoon invite-passcode-gate__cartoon--spark-a" viewBox="0 0 20 20" fill="none">
                <path d="M10 1.5l1.4 6.1L17.5 10l-6.1 1.4L10 18.5l-1.4-7.1L2.5 10l6.1-1.4L10 1.5z" fill="#E8D5A8" />
            </svg>
            <svg className="invite-passcode-gate__cartoon invite-passcode-gate__cartoon--spark-b" viewBox="0 0 16 16" fill="none">
                <path d="M8 1l1 4.4L13.5 8 9 9.6 8 15 7 9.6 2.5 8 7 5.4 8 1z" fill="#F2B8A8" />
            </svg>
            <svg className="invite-passcode-gate__cartoon invite-passcode-gate__cartoon--spark-c" viewBox="0 0 14 14" fill="none">
                <path d="M7 1l.8 3.6L11.5 7 7.8 8.4 7 13 6.2 8.4 2.5 7 6.2 4.6 7 1z" fill="#C9A0B0" />
            </svg>
            <svg className="invite-passcode-gate__cartoon invite-passcode-gate__cartoon--spark-d" viewBox="0 0 12 12" fill="none">
                <path d="M6 1l.7 3L10 6 6.7 7.2 6 11 5.3 7.2 2 6 5.3 4 6 1z" fill="#B7CBD8" />
            </svg>
            <svg className="invite-passcode-gate__cartoon invite-passcode-gate__cartoon--spark-e" viewBox="0 0 12 12" fill="none">
                <path d="M6 1l.7 3L10 6 6.7 7.2 6 11 5.3 7.2 2 6 5.3 4 6 1z" fill="#C9D9C3" />
            </svg>
        </div>
    );
}

export function InvitationPasscodeGate({
    unlockUrl,
    returnTo,
    title,
    introStyle,
    theme,
}: InvitationPasscodeGateProps) {
    const form = useForm({
        passcode: '',
        return_to: returnTo,
    });
    const [show, setShow] = useState(false);
    const [shake, setShake] = useState(false);
    const [entered, setEntered] = useState(false);
    const [success, setSuccess] = useState(false);
    const inputId = useId();
    const errorId = useId();
    const ready = form.data.passcode.trim().length >= 4;
    const styleId = resolveIntroStyleId(introStyle);
    const surface = useMemo(
        () => (DARK_INTRO_STYLES.includes(styleId) ? 'dark' : 'light'),
        [styleId],
    );

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => setEntered(true));
        return () => window.cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        if (!form.errors.passcode) {
            return;
        }
        setSuccess(false);
        setShake(true);
        const timer = window.setTimeout(() => setShake(false), 560);
        return () => window.clearTimeout(timer);
    }, [form.errors.passcode]);

    const vars = {
        ['--gate-paper' as string]: theme.paper,
        ['--gate-ink' as string]: theme.ink,
        ['--gate-seal' as string]: theme.seal,
        ['--gate-accent' as string]: theme.accent,
    } as CSSProperties;

    function onSubmit(event: FormEvent): void {
        event.preventDefault();
        if (!ready || form.processing) {
            return;
        }
        setSuccess(true);
        form.post(unlockUrl, {
            preserveScroll: true,
            onError: () => setSuccess(false),
        });
    }

    return (
        <div
            style={vars}
            className={cn(
                'invite-passcode-gate',
                `invite-passcode-gate--${surface}`,
                `invite-passcode-gate--${styleId}`,
                entered && 'is-in',
                shake && 'is-shake',
                success && form.processing && 'is-success',
            )}
        >
            <div className="invite-passcode-gate__stage">
                <GateCartoons />
                <div className={cn('invite-passcode-gate__card', shake && 'is-shake')}>
                    <div className={cn('invite-passcode-gate__badge', shake && 'is-pulse')} aria-hidden>
                        <Lock className="invite-passcode-gate__badge-icon" strokeWidth={2.25} />
                    </div>

                    <div className="invite-passcode-gate__header">
                        <h1 className="invite-passcode-gate__title">Enter passcode</h1>
                        <p className="invite-passcode-gate__subtitle">
                            Unlock <span>{title}</span>
                        </p>
                    </div>

                    <form className="invite-passcode-gate__form" onSubmit={onSubmit}>
                        <label htmlFor={inputId} className="sr-only">
                            Invitation passcode
                        </label>

                        <div className={cn('invite-passcode-gate__field', shake && 'is-invalid')}>
                            <input
                                id={inputId}
                                autoFocus
                                autoComplete="one-time-code"
                                inputMode="text"
                                spellCheck={false}
                                type={show ? 'text' : 'password'}
                                value={form.data.passcode}
                                onChange={(event) => form.setData('passcode', event.target.value)}
                                placeholder="Your passcode"
                                className="invite-passcode-gate__input"
                                maxLength={32}
                                required
                                minLength={4}
                                aria-invalid={form.errors.passcode ? true : undefined}
                                aria-describedby={form.errors.passcode ? errorId : undefined}
                            />
                            <button
                                type="button"
                                className="invite-passcode-gate__reveal"
                                onClick={() => setShow((value) => !value)}
                                aria-label={show ? 'Hide passcode' : 'Show passcode'}
                            >
                                {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                            </button>
                        </div>

                        {form.errors.passcode ? (
                            <div id={errorId} className="invite-passcode-gate__status" aria-live="polite">
                                <p className="invite-passcode-gate__error" role="alert">
                                    {form.errors.passcode}
                                </p>
                            </div>
                        ) : null}

                        <button type="submit" disabled={form.processing || !ready} className="invite-passcode-gate__submit">
                            {form.processing ? 'Unlocking…' : 'Unlock invitation'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
