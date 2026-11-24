<?php

namespace App\Services;

use App\Models\User;
use App\Models\Wedding;
use App\Notifications\HostDailyDigest;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Throwable;

class HostDigestService
{
    /**
     * Build and send yesterday→now digests for hosts with activity.
     *
     * @return array{sent: int, skipped: int, failed: int}
     */
    public function sendDaily(?CarbonInterface $since = null): array
    {
        if (! config('platform.host_digest_enabled', true)) {
            return ['sent' => 0, 'skipped' => 0, 'failed' => 0];
        }

        $since ??= now()->subDay();
        $sent = 0;
        $skipped = 0;
        $failed = 0;

        User::query()
            ->whereHas('weddings')
            ->orderBy('id')
            ->chunkById(50, function ($users) use ($since, &$sent, &$skipped, &$failed): void {
                foreach ($users as $user) {
                    try {
                        $payload = $this->digestForUser($user, $since);
                        if ($payload['total'] < 1) {
                            $skipped++;

                            continue;
                        }

                        $user->notify(new HostDailyDigest($payload));
                        $sent++;
                    } catch (Throwable $e) {
                        $failed++;
                        Log::warning('Host digest failed', [
                            'user_id' => $user->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            });

        return compact('sent', 'skipped', 'failed');
    }

    /**
     * @return array{
     *     total: int,
     *     since: string,
     *     events: list<array{id: int, title: string, rsvps: int, wishes: int, photos: int, url: string}>
     * }
     */
    public function digestForUser(User $user, CarbonInterface $since): array
    {
        $events = [];
        $total = 0;
        $sinceAt = Carbon::parse($since);

        $weddings = Wedding::query()
            ->where('user_id', $user->id)
            ->with(['setting'])
            ->get();

        foreach ($weddings as $wedding) {
            $rsvps = $wedding->rsvps()->where('created_at', '>=', $sinceAt)->count();
            $wishes = $wedding->guestbookEntries()->where('created_at', '>=', $sinceAt)->count();
            $photos = $wedding->guestPhotos()->where('created_at', '>=', $sinceAt)->count();
            $sum = $rsvps + $wishes + $photos;
            if ($sum < 1) {
                continue;
            }

            $total += $sum;
            $events[] = [
                'id' => $wedding->id,
                'title' => $wedding->displayTitle(),
                'rsvps' => $rsvps,
                'wishes' => $wishes,
                'photos' => $photos,
                'url' => url('/events/'.$wedding->id),
            ];
        }

        return [
            'total' => $total,
            'since' => $sinceAt->toIso8601String(),
            'events' => $events,
        ];
    }
}
