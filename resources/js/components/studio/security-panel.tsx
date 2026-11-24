import { Check, Copy, Eye, EyeOff, KeyRound, ShieldCheck, X } from 'lucide-react';
import { useEffect, useId, useState, type CSSProperties } from 'react';
import { EditorNotice } from '@/components/studio/editor-fields';
import { StudioToggle } from '@/components/studio/studio-toggle';
import { copyToClipboard } from '@/lib/clipboard';
import { cn } from '@/lib/utils';

export function isSitePasscodeEnabled(details: Record<string, string> | null | undefined): boolean {
    const enabled = (details?.site_passcode_enabled ?? '').trim().toLowerCase();
    const set = (details?.site_passcode_set ?? '').trim() === '1';

    if (enabled === '0' || enabled === 'false' || enabled === 'off') {
        return false;
    }
    if (enabled === '1' || enabled === 'true' || enabled === 'on') {
        return true;
    }

    return set;
}

export function SecurityPanel({
    passcodeEnabled,
    passcodeSet,
    onPasscodeEnabledChange,
    onPasscodeChange,
    onPasscodeClear,
}: {
    passcodeEnabled: boolean;
    passcodeSet: boolean;
    onPasscodeEnabledChange: (enabled: boolean) => void;
    onPasscodeChange: (passcode: string) => void;
    onPasscodeClear: () => void;
}) {
    const [draft, setDraft] = useState('');
    const [show, setShow] = useState(false);
    const [copied, setCopied] = useState(false);
    const [pulse, setPulse] = useState(false);
    const draftId = useId();
    const draftReady = draft.trim().length >= 4;
    const protectionReady = passcodeSet || draftReady;
    const fieldsOpen = passcodeEnabled || passcodeSet || draft.length > 0;

    useEffect(() => {
        if (!passcodeEnabled) {
            return;
        }
        setPulse(true);
        const timer = window.setTimeout(() => setPulse(false), 700);
        return () => window.clearTimeout(timer);
    }, [passcodeEnabled]);

    async function copyDraft(): Promise<void> {
        if (!draft.trim()) {
            return;
        }
        const ok = await copyToClipboard(draft.trim());
        if (!ok) {
            return;
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    }

    function handleDraftChange(value: string): void {
        setDraft(value);
        const trimmed = value.trim();
        if (trimmed.length >= 4) {
            onPasscodeChange(trimmed);
            if (!passcodeEnabled) {
                onPasscodeEnabledChange(true);
            }
            return;
        }
        onPasscodeChange('');
    }

    function handleToggle(enabled: boolean): void {
        if (enabled && !passcodeSet && !draftReady) {
            // Turn on only after a code is ready — otherwise live site cannot protect.
            onPasscodeEnabledChange(true);
            window.requestAnimationFrame(() => {
                document.getElementById(draftId)?.focus();
            });
            return;
        }
        onPasscodeEnabledChange(enabled);
        if (enabled && draftReady) {
            onPasscodeChange(draft.trim());
        }
    }

    const statusLabel = !passcodeEnabled
        ? passcodeSet
            ? 'Saved · paused'
            : 'Open invite'
        : protectionReady
          ? 'Protection on'
          : 'Needs a code';

    return (
        <div className="mt-4 space-y-4">
            <EditorNotice>
                Keep the live invitation private with a shareable door code. Hosts always bypass this in studio
                preview.
            </EditorNotice>

            <section
                style={
                    {
                        '--pref-paper': '#f3ebe1',
                        '--pref-ink': '#2c241c',
                        '--pref-seal': '#8b6840',
                        '--pref-accent': '#c4a574',
                    } as CSSProperties
                }
                className="overflow-hidden rounded-[1.35rem] border border-[color-mix(in_oklab,var(--pref-ink)_10%,transparent)] bg-[linear-gradient(165deg,color-mix(in_oklab,var(--pref-paper)_92%,white)_0%,#fff_42%,color-mix(in_oklab,var(--pref-accent)_14%,white)_100%)] shadow-[0_22px_48px_-30px_color-mix(in_oklab,var(--pref-ink)_55%,transparent)]"
            >
                <div className="relative px-4 pt-4 pb-3">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-[0.35]"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 12% 18%, color-mix(in_oklab, var(--pref-accent) 28%, transparent), transparent 42%), radial-gradient(circle at 88% 0%, color-mix(in_oklab, var(--pref-seal) 16%, transparent), transparent 36%)',
                        }}
                    />
                    <div className="relative flex items-start gap-3">
                        <span
                            className={cn(
                                'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--pref-ink)] text-[color-mix(in_oklab,var(--pref-paper)_92%,white)] shadow-[0_10px_24px_-12px_var(--pref-ink)] ring-2 ring-[color-mix(in_oklab,var(--pref-accent)_55%,white)] transition-transform duration-500',
                                pulse && 'scale-105',
                            )}
                        >
                            <KeyRound className="size-4" />
                            <span
                                aria-hidden
                                className={cn(
                                    'absolute -inset-1 rounded-full border border-[color-mix(in_oklab,var(--pref-seal)_40%,transparent)] opacity-0 transition-opacity duration-500',
                                    pulse && 'opacity-100',
                                )}
                            />
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[13px] font-semibold tracking-tight text-[var(--pref-ink)]">
                                    Invitation passcode
                                </p>
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.04em] uppercase',
                                        passcodeEnabled && protectionReady
                                            ? 'bg-[color-mix(in_oklab,var(--pref-seal)_18%,white)] text-[var(--pref-seal)]'
                                            : passcodeEnabled
                                              ? 'bg-amber-100 text-amber-900/80'
                                              : 'bg-zinc-900/5 text-zinc-500',
                                    )}
                                >
                                    {passcodeEnabled && protectionReady ? (
                                        <ShieldCheck className="size-3" />
                                    ) : (
                                        <KeyRound className="size-3" />
                                    )}
                                    {statusLabel}
                                </span>
                            </div>
                            <p className="mt-1 max-w-[36ch] text-[11.5px] leading-relaxed text-[color-mix(in_oklab,var(--pref-ink)_62%,transparent)]">
                                Guests (and View site) must enter this once per browser session before the invitation
                                opens — including personal links. Save after setting a code.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative space-y-3 px-3 pb-3.5">
                    <StudioToggle
                        tone="ink"
                        checked={passcodeEnabled}
                        onCheckedChange={handleToggle}
                        label="Protect guest site with a passcode"
                        description={
                            passcodeEnabled
                                ? protectionReady
                                    ? 'Guests unlock once, then browse freely in that session.'
                                    : 'Toggle is on — set a 4–32 character code below to activate.'
                                : 'Off by default. Turn on to set a door code for guests.'
                        }
                    />

                    <div
                        className={cn(
                            'grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                            fieldsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                        )}
                    >
                        <div className="overflow-hidden">
                            <div className="space-y-3 rounded-[1.15rem] bg-white/75 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] ring-1 ring-[color-mix(in_oklab,var(--pref-ink)_8%,transparent)] backdrop-blur-sm">
                                <div className="grid gap-2">
                                    <div className="flex items-end justify-between gap-3 px-0.5">
                                        <label
                                            htmlFor={draftId}
                                            className="text-[11px] font-semibold tracking-[0.08em] text-zinc-500 uppercase"
                                        >
                                            {passcodeSet ? 'Replace passcode' : 'Passcode'}
                                        </label>
                                        <span className="text-[11px] text-zinc-400">4–32 characters</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            id={draftId}
                                            type={show ? 'text' : 'password'}
                                            value={draft}
                                            placeholder={passcodeSet ? 'Enter a new code to replace' : 'e.g. forever2027'}
                                            maxLength={32}
                                            autoComplete="new-password"
                                            spellCheck={false}
                                            onChange={(event) => handleDraftChange(event.target.value)}
                                            className={cn(
                                                'h-12 w-full rounded-2xl border-0 bg-[color-mix(in_oklab,var(--pref-paper)_55%,white)] px-4 pr-24 font-medium tracking-[0.18em] text-[var(--pref-ink)] shadow-none outline-none',
                                                'ring-1 ring-[color-mix(in_oklab,var(--pref-ink)_10%,transparent)] transition-all duration-200',
                                                'placeholder:tracking-normal placeholder:text-zinc-400',
                                                'focus:bg-white focus:ring-2 focus:ring-[color-mix(in_oklab,var(--pref-seal)_35%,transparent)]',
                                            )}
                                        />
                                        <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 gap-0.5">
                                            <button
                                                type="button"
                                                className="inline-flex size-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                                                onClick={() => setShow((value) => !value)}
                                                aria-label={show ? 'Hide passcode' : 'Show passcode'}
                                            >
                                                {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                            </button>
                                            <button
                                                type="button"
                                                className="inline-flex size-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-35"
                                                disabled={!draftReady}
                                                onClick={() => void copyDraft()}
                                                aria-label="Copy passcode"
                                            >
                                                {copied ? (
                                                    <Check className="size-3.5 text-emerald-600" />
                                                ) : (
                                                    <Copy className="size-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <p className="px-0.5 text-[11px] leading-relaxed text-zinc-500">
                                        Copy into WhatsApp or texts when you share the invite — we never email this
                                        code for you.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 border-t border-[color-mix(in_oklab,var(--pref-ink)_7%,transparent)] pt-3">
                                    {passcodeSet ? (
                                        <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[color-mix(in_oklab,var(--pref-seal)_85%,black)]">
                                            <ShieldCheck className="size-3.5" />
                                            Code saved
                                            {passcodeEnabled ? ' and active after save' : ' · toggle off pauses it'}
                                        </p>
                                    ) : passcodeEnabled ? (
                                        <p className="text-[11px] font-medium text-amber-800/85">
                                            Enter a code of at least 4 characters, then click Save — protection starts
                                            only after save.
                                        </p>
                                    ) : (
                                        <p className="text-[11px] text-zinc-500">No passcode stored yet</p>
                                    )}

                                    {passcodeSet ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDraft('');
                                                onPasscodeChange('');
                                                onPasscodeClear();
                                            }}
                                            className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--pref-ink)_6%,white)] px-3 text-[11px] font-semibold text-[var(--pref-ink)] transition hover:bg-[color-mix(in_oklab,var(--pref-ink)_10%,white)]"
                                        >
                                            <X className="size-3.5" />
                                            Remove passcode
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
