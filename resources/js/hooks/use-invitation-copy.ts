import { usePreviewLive } from '@/components/marketing/site-previews/preview-live';
import { copyFor, type InvitationCopy } from '@/lib/invitation-copy';

/** Locale-aware UI chrome for gallery live sites and editor preview. */
export function useInvitationCopy(localeOverride?: string | null): InvitationCopy {
    const live = usePreviewLive();
    const locale = (localeOverride || live?.locale || 'en').trim() || 'en';

    return copyFor(locale);
}
