import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
    referral_code?: string;
    partner_code?: string;
};

export default function Register({ passwordRules, referral_code = '', partner_code = '' }: Props) {
    return (
        <>
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        {referral_code ? <input type="hidden" name="referral_code" value={referral_code} /> : null}
                        {partner_code ? <input type="hidden" name="partner_code" value={partner_code} /> : null}
                        {(referral_code || partner_code) && (
                            <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-[12px] text-emerald-900 ring-1 ring-emerald-200/80">
                                {partner_code
                                    ? `Partner code ${partner_code} applied — extra free site days when you publish.`
                                    : `Referral ${referral_code} applied — your friend earns a reward when you publish.`}
                            </p>
                        )}
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Your name"
                                    className="h-11 rounded-2xl border-[#241c16]/10 bg-[#fbf8f3] px-4"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="you@studio.com"
                                    className="h-11 rounded-2xl border-[#241c16]/10 bg-[#fbf8f3] px-4"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    passwordrules={passwordRules}
                                    className="h-11 rounded-2xl border-[#241c16]/10 bg-[#fbf8f3] px-4"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    passwordrules={passwordRules}
                                    className="h-11 rounded-2xl border-[#241c16]/10 bg-[#fbf8f3] px-4"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 h-11 w-full rounded-full bg-[#c6a36a] text-white shadow-sm hover:bg-[#b8945b]"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Design your first invite
                            </Button>
                        </div>

                        <div className="text-center text-sm text-[#5e554c]">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={6}>
                                Welcome back
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Begin your celebration',
    description: 'Use the studio now. Confirm your email later from Profile settings.',
};
