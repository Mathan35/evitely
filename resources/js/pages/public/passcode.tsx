import { Head } from '@inertiajs/react';
import { InvitationPasscodeGate } from '@/components/invitation/invitation-passcode-gate';

export default function PublicPasscode({
    unlockUrl,
    returnTo,
    hosts,
    initials,
    title,
    introStyle = 'gatefold',
    theme,
}: {
    slug: string;
    unlockUrl: string;
    returnTo: string;
    hosts: string[];
    initials: string;
    title: string;
    introStyle?: string;
    theme: {
        paper: string;
        ink: string;
        seal: string;
        accent: string;
    };
}) {
    return (
        <>
            <Head title={`Unlock · ${title}`} />
            <InvitationPasscodeGate
                unlockUrl={unlockUrl}
                returnTo={returnTo}
                hosts={hosts}
                initials={initials}
                title={title}
                introStyle={introStyle}
                theme={theme}
            />
        </>
    );
}
