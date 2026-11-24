<?php

namespace App\Services;

use App\Enums\GuestbookStatus;
use App\Models\User;
use App\Models\Wedding;
use Carbon\Carbon;

class HostAlertsService
{
    /**
     * Lightweight host inbox for RSVP / wish / photo activity across accessible events.
     *
     * @return array{
     *   total: int,
     *   rsvps: int,
     *   wishes: int,
     *   photos: int,
     *   items: list<array{id: string, type: string, title: string, detail: string, href: string, at: ?string}>
     * }
     */
    public function forUser(User $user): array
    {
        $weddings = Wedding::query()
            ->accessibleBy($user)
            ->with([
                'rsvps' => fn ($query) => $query->latest()->limit(8),
                'guestbookEntries' => fn ($query) => $query->where('status', GuestbookStatus::Pending)->latest()->limit(8),
                'guestPhotos' => fn ($query) => $query->where('status', GuestbookStatus::Pending)->latest()->limit(8),
            ])
            ->latest('id')
            ->limit(40)
            ->get();

        $items = [];
        $rsvpCount = 0;
        $wishCount = 0;
        $photoCount = 0;
        $since = Carbon::now()->subDays(14);

        foreach ($weddings as $wedding) {
            $title = $wedding->displayTitle();
            $manage = route('weddings.show', $wedding);

            foreach ($wedding->guestbookEntries as $entry) {
                $wishCount++;
                $items[] = [
                    'id' => 'wish-'.$entry->id,
                    'type' => 'wish',
                    'title' => $entry->name,
                    'detail' => 'Wish pending · '.$title,
                    'href' => $manage.'#wishes',
                    'at' => $entry->created_at?->toIso8601String(),
                ];
            }

            foreach ($wedding->guestPhotos as $photo) {
                $photoCount++;
                $items[] = [
                    'id' => 'photo-'.$photo->id,
                    'type' => 'photo',
                    'title' => $photo->name,
                    'detail' => 'Photo pending · '.$title,
                    'href' => $manage.'#photos',
                    'at' => $photo->created_at?->toIso8601String(),
                ];
            }

            foreach ($wedding->rsvps as $rsvp) {
                if ($rsvp->created_at && $rsvp->created_at->lt($since)) {
                    continue;
                }
                $rsvpCount++;
                $items[] = [
                    'id' => 'rsvp-'.$rsvp->id,
                    'type' => 'rsvp',
                    'title' => $rsvp->guest_name,
                    'detail' => 'RSVP · '.str_replace('_', ' ', $rsvp->status->value).' · '.$title,
                    'href' => $manage.'#rsvps',
                    'at' => $rsvp->created_at?->toIso8601String(),
                ];
            }
        }

        usort($items, function (array $a, array $b): int {
            return strcmp((string) ($b['at'] ?? ''), (string) ($a['at'] ?? ''));
        });

        $items = array_slice($items, 0, 12);

        return [
            'total' => $wishCount + $photoCount + $rsvpCount,
            'rsvps' => $rsvpCount,
            'wishes' => $wishCount,
            'photos' => $photoCount,
            'items' => array_values($items),
        ];
    }
}
