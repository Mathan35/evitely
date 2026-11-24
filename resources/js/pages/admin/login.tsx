import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';

export default function AdminLogin() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <Head title="Admin sign in" />
            <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-zinc-950 px-4 py-10 text-zinc-100">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-60"
                    style={{
                        background:
                            'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(255,255,255,0.12), transparent 55%), radial-gradient(ellipse 40% 30% at 90% 80%, rgba(113,113,122,0.25), transparent 50%)',
                    }}
                />
                <div className="relative w-full max-w-md">
                    <div className="mb-8 text-center">
                        <p className="text-[10px] font-semibold tracking-[0.22em] text-zinc-500 uppercase">Owner console</p>
                        <h1 className="mt-2 font-serif text-3xl tracking-tight text-white">Admin sign in</h1>
                        <p className="mt-2 text-[13px] text-zinc-400">Platform management only — not the studio login.</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
                        <Form
                            action="/admin/login"
                            method="post"
                            resetOnSuccess={['password']}
                            className="space-y-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="space-y-1.5">
                                        <label htmlFor="email" className="text-[11px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
                                            Email
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            autoFocus
                                            autoComplete="username"
                                            placeholder="owner@example.com"
                                            className="h-11 w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 text-[14px] text-white outline-none placeholder:text-zinc-600 focus:border-zinc-400"
                                        />
                                        <InputError message={errors.email} className="text-red-300" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="password" className="text-[11px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                autoComplete="current-password"
                                                placeholder="Password"
                                                className="h-11 w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 pr-16 text-[14px] text-white outline-none placeholder:text-zinc-600 focus:border-zinc-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((value) => !value)}
                                                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] font-medium text-zinc-400 hover:text-white"
                                            >
                                                {showPassword ? 'Hide' : 'Show'}
                                            </button>
                                        </div>
                                        <InputError message={errors.password} className="text-red-300" />
                                    </div>

                                    <label className="flex items-center gap-2 text-[13px] text-zinc-400">
                                        <input
                                            type="checkbox"
                                            name="remember"
                                            value="1"
                                            className="size-4 rounded border-white/20 bg-zinc-950 text-zinc-100"
                                        />
                                        Keep me signed in
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex h-11 w-full items-center justify-center rounded-xl bg-white text-[13px] font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-60"
                                    >
                                        {processing ? 'Signing in…' : 'Sign in to admin'}
                                    </button>
                                </>
                            )}
                        </Form>
                    </div>

                    <p className="mt-6 text-center text-[12px] text-zinc-500">
                        Looking for the studio?{' '}
                        <a href="/login" className="text-zinc-300 underline-offset-2 hover:text-white hover:underline">
                            Studio login
                        </a>
                    </p>
                </div>
            </div>
        </>
    );
}
