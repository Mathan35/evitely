<?php

namespace App\Services\Premium;

use App\Models\Wedding;
use App\Models\WeddingGuest;
use App\Support\InviteHost;
use App\Support\ShareMessageFactory;

/**
 * Host-facing share kit: link, WhatsApp text, QR target, story caption, guest personal link.
 */
class ShareKitService
{
    /**
     * @return array<string, mixed>
     */
    public function forWedding(Wedding $wedding, ?WeddingGuest $guest = null): array
    {
        $wedding->loadMissing(['setting', 'hosts', 'eventType']);
        $publicUrl = InviteHost::publicUrl($wedding->slug);
        $publicText = ShareMessageFactory::publicText($wedding, $publicUrl);

        $guestUrl = null;
        $guestText = null;
        if ($guest && filled($guest->guest_token)) {
            $guestUrl = InviteHost::guestUrl($wedding->slug, (string) $guest->guest_token);
            $guestText = ShareMessageFactory::guestText($wedding, $guest);
        }

        $title = $wedding->displayTitle();
        $date = $wedding->starts_on?->format('j F Y') ?? '';
        $storyCaption = trim($title.($date !== '' ? ' · '.$date : '')."\n".$publicUrl);
        $links = ShareMessageFactory::links($publicText, $publicUrl);

        return [
            'title' => $title,
            'public_url' => $publicUrl,
            'guest_url' => $guestUrl,
            'qr_url' => $publicUrl,
            'whatsapp_url' => $links['whatsapp'],
            'sms_url' => $links['sms'],
            'email_url' => $links['email'],
            'telegram_url' => $links['telegram'],
            'public_text' => $publicText,
            'guest_text' => $guestText,
            'story_caption' => $storyCaption,
            'story_image_hint' => 'Export a 1080×1920 card (Story format) for Instagram / WhatsApp Status.',
        ];
    }
}
