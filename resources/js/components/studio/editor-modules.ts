import type { LucideIcon } from 'lucide-react';
import {
    ImageIcon,
    ImagePlus,
    LayoutList,
    MapPin,
    Music2,
    Palette,
    Search,
    Settings2,
    Shield,
    SlidersHorizontal,
    Sparkles,
    Timer,
    Type,
    Users,
    UserRound,
    MailOpen,
} from 'lucide-react';
import { CORE_SITE_AVAILABLE_OCCASIONS } from '@/lib/core-site-sections';

export type EditorSectionId =
    | 'names'
    | 'content'
    | 'hero'
    | 'design'
    | 'intro'
    | 'invitation'
    | 'timer'
    | 'guide'
    | 'location'
    | 'photos'
    | 'guests'
    | 'music'
    | 'preferences'
    | 'seo'
    | 'security'
    | 'site';

export type EditorSection = {
    id: EditorSectionId;
    label: string;
    /** Compact label for the mobile dock. */
    shortLabel?: string;
    hint: string;
    icon: LucideIcon;
    /** When set, only show this section for matching occasion slugs. */
    occasions?: string[];
};

export const EDITOR_SECTIONS: EditorSection[] = [
    { id: 'names', label: 'Names & date', shortLabel: 'Names', hint: 'Hosts and celebration date', icon: UserRound },
    { id: 'content', label: 'Content', shortLabel: 'Text', hint: 'Hero, story, gallery, RSVP copy', icon: Type },
    { id: 'hero', label: 'Hero & header', shortLabel: 'Hero', hint: 'Hero layouts, header links, and background image', icon: ImagePlus },
    { id: 'design', label: 'Background', shortLabel: 'Color', hint: 'Soft page background colors', icon: Palette },
    { id: 'intro', label: 'Intro', shortLabel: 'Intro', hint: 'How guests open the invitation', icon: Sparkles },
    { id: 'invitation', label: 'Invitation card', shortLabel: 'Card', hint: 'Your created cards (optional)', icon: MailOpen },
    {
        id: 'timer',
        label: 'Countdown',
        shortLabel: 'Timer',
        hint: 'Live countdown designs for the big day',
        icon: Timer,
    },
    {
        id: 'guide',
        label: 'Custom sections',
        shortLabel: 'Custom',
        hint: 'FAQ, attire, gifts, travel, and more — off until you enable them',
        icon: LayoutList,
        occasions: [...CORE_SITE_AVAILABLE_OCCASIONS],
    },
    { id: 'location', label: 'Location', shortLabel: 'Venue', hint: 'Itinerary and event venues', icon: MapPin },
    { id: 'photos', label: 'Photos', shortLabel: 'Photos', hint: 'Gallery tiles on the template', icon: ImageIcon },
    { id: 'guests', label: 'Guests', shortLabel: 'Guests', hint: 'Sample guest list on the site', icon: Users },
    { id: 'music', label: 'Music', shortLabel: 'Music', hint: 'Background audio', icon: Music2 },
    {
        id: 'preferences',
        label: 'Preferences',
        shortLabel: 'Prefs',
        hint: 'Language, culture, celebrate, and RSVP reminders',
        icon: SlidersHorizontal,
    },
    {
        id: 'seo',
        label: 'Share & SEO',
        shortLabel: 'SEO',
        hint: 'Title and description for WhatsApp and search',
        icon: Search,
    },
    {
        id: 'security',
        label: 'Security',
        shortLabel: 'Secure',
        hint: 'Passcode protection for the guest invitation',
        icon: Shield,
    },
    { id: 'site', label: 'Guest link', shortLabel: 'Link', hint: 'Public URL for guests', icon: Settings2 },
];

export function editorSectionsForOccasion(occasion?: string | null): EditorSection[] {
    const slug = (occasion || 'wedding').toLowerCase().replace(/_/g, '-');

    return EDITOR_SECTIONS.filter((section) => {
        if (!section.occasions?.length) {
            return true;
        }

        return section.occasions.some((item) => item === slug || slug.includes(item));
    });
}

export type EditorDevice = 'desktop' | 'mobile';

export const EDITOR_DEVICE_WIDTH: Record<EditorDevice, string> = {
    desktop: 'min(100%, 880px)',
    mobile: 'min(100%, 390px)',
};
