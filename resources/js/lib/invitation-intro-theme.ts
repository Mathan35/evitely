import { babyShowerSiteTheme } from '@/components/marketing/site-previews/baby-shower-site-themes';
import { birthdaySiteTheme } from '@/components/marketing/site-previews/birthday-site-themes';
import { bridalShowerSiteTheme } from '@/components/marketing/site-previews/bridal-shower-site-themes';
import { corporateSiteTheme } from '@/components/marketing/site-previews/corporate-site-themes';
import { customSiteTheme } from '@/components/marketing/site-previews/custom-site-themes';
import { graduationSiteTheme } from '@/components/marketing/site-previews/graduation-site-themes';
import { housewarmingSiteTheme } from '@/components/marketing/site-previews/housewarming-site-themes';
import { partySiteTheme } from '@/components/marketing/site-previews/party-site-themes';
import { weddingSiteTheme } from '@/components/marketing/site-previews/wedding-site-themes';
import {
    buildInvitationIntroContent,
    type InvitationIntroContent,
} from '@/components/invitation/invitation-intro';
import type { GalleryDesign } from '@/types/gallery';
import type { PreviewLiveContent } from '@/components/marketing/site-previews/preview-live';

type ThemeBits = { bg: string; ink: string; accent: string };

function themeFor(slug: string, styleKey: string): ThemeBits {
    switch (slug) {
        case 'wedding':
            return weddingSiteTheme(styleKey);
        case 'birthday':
            return birthdaySiteTheme(styleKey);
        case 'corporate':
        case 'corporate-event':
            return corporateSiteTheme(styleKey);
        case 'baby-shower':
            return babyShowerSiteTheme(styleKey);
        case 'party':
            return partySiteTheme(styleKey);
        case 'bridal-shower':
            return bridalShowerSiteTheme(styleKey);
        case 'graduation':
            return graduationSiteTheme(styleKey);
        case 'housewarming':
            return housewarmingSiteTheme(styleKey);
        default:
            return customSiteTheme(styleKey);
    }
}

/** Join host names for intro — omit blank partner / co-host fields. */
export function formatIntroHosts(groom?: string | null, bride?: string | null): string {
    return [groom, bride]
        .map((part) => (part || '').trim())
        .filter(Boolean)
        .join(' & ');
}

function hostsFromLive(live?: PreviewLiveContent | null, design?: GalleryDesign | null): string {
    const brideRaw = live?.bride;
    const groomRaw = live?.groom;
    const bride = (brideRaw ?? '').trim();
    const groom = (groomRaw ?? '').trim();
    // Once live name fields exist (including ''), never resurrect gallery sample pairs.
    const liveNamesTouched =
        live != null && (brideRaw !== undefined || groomRaw !== undefined || live.host !== undefined);

    if (liveNamesTouched) {
        const pair = formatIntroHosts(groom, bride);
        if (pair) {
            return pair;
        }
        if (live.host?.trim()) {
            return live.host.trim();
        }
        if (live.company?.trim()) {
            return live.company.trim();
        }
        if (live.eventName?.trim()) {
            return live.eventName.trim();
        }
        return design?.name?.trim() || 'You are invited';
    }

    const pair = formatIntroHosts(groom, bride);
    if (pair) {
        return pair;
    }
    if (live?.host?.trim()) {
        return live.host.trim();
    }
    if (live?.company?.trim()) {
        return live.company.trim();
    }
    if (live?.eventName?.trim()) {
        return live.eventName.trim();
    }
    return design?.sample?.hosts?.trim() || design?.name || 'You are invited';
}

/** Build intro copy + palette for any gallery / live surface. */
export function resolveInvitationIntroContent(input: {
    eventSlug: string;
    design?: GalleryDesign | null;
    live?: PreviewLiveContent | null;
    guestName?: string | null;
    locale?: string | null;
}): InvitationIntroContent {
    const styleKey = input.design?.style_key || 'default';
    const theme = themeFor(input.eventSlug, styleKey);
    const paper = input.live?.siteBg?.trim() || theme.bg || input.design?.palette?.paper || '#f9ebe7';
    const ink = theme.ink || '#7a514d';
    const seal = theme.accent || input.design?.palette?.gold || '#a67068';
    const hosts = hostsFromLive(input.live, input.design);

    return buildInvitationIntroContent({
        eventSlug: input.eventSlug,
        locale: input.locale || input.live?.locale || 'en',
        hosts,
        guestName: input.guestName,
        paper,
        ink,
        seal,
    });
}
