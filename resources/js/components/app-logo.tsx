import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <AppLogoIcon className="h-7 w-7 sm:h-8 sm:w-8" />
            <div className="ml-2 grid min-w-0 flex-1 text-left text-sm">
                <span className="truncate font-serif text-[15px] leading-none tracking-tight sm:text-base">
                    {typeof name === 'string' && name.trim() ? name : 'Invidora'}
                </span>
            </div>
        </>
    );
}
